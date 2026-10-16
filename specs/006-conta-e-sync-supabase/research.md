# Research & Architectural Decisions: 006-conta-e-sync-supabase

**Feature**: `006-conta-e-sync-supabase`  
**Date**: 2026-10-16  
**Status**: Completed  

---

## 1. Autenticação e Sessão Segura (Supabase Auth + Expo Secure Store)

### Decisão
Utilizar `@supabase/supabase-js` configurado com um adaptador de persistência customizado baseado em `expo-secure-store`, utilizando autenticação por e-mail com código de uso único de 6 dígitos (`signInWithOtp` + `verifyOtp`).

### Rationale
- O aplicativo adota o princípio de **Acesso Imediato no Curral**: o operador não precisa estar conectado para trabalhar.
- No meio rural, autenticação com senha estática gera atrito elevado (esquecimento, teclado alfanumérico desconfortável, bloqueios de conta). O código numérico de 6 dígitos (OTP) recebido no e-mail pode ser digitado em teclado numérico nativo de 48+ px.
- `expo-secure-store` grava tokens de autenticação (JWT de acesso e refresh token) no iOS Keychain e Android Keystore, cumprindo integralmente o Princípio V da Constituição (proibição de tokens em `AsyncStorage` ou SQLite).

### Alternativas Consideradas
- **Magic Link (Link Mágico no e-mail)**: Rejeitado porque links de redirecionamento profundo (deep links) falham frequentemente em navegadores customizados de celulares Android de baixo custo comuns no campo, ou desviam o operador para fora do aplicativo. O OTP digitado dentro do app é 100% determinístico.
- **AsyncStorage**: Rejeitado por persistir dados em texto puro desprotegido no sistema de arquivos do dispositivo.
- **Email + Senha**: Rejeitado devido ao atrito de criação de senha e fluxos de recuperação inadequados para operadores em trânsito rural.

---

## 2. Monitoramento de Rede e Gatilhos de Sincronização

### Decisão
Manter e estender a infraestrutura já implementada em `src/core/network/network-monitor.ts` (`@react-native-community/netinfo`), combinando quatro gatilhos de sincronização determinísticos:
1. **Abertura e Retorno do App**: Detecção de transição para o primeiro plano via `AppState` (`active`).
2. **Reconexão de Rede**: Listener do `NetworkMonitor` disparando sincronização assim que `isOnline()` volta a ser verdadeiro.
3. **Pós-Gravação Local com Debounce**: Disparo automático com debounce de 500ms através do `scheduler.ts` existente sempre que uma nova mutação entra na outbox.
4. **Sincronização Manual**: Botão explícito "Forçar Sincronização" na aba Ajustes.

### Rationale
- `@react-native-community/netinfo` já está instalado (`package.json`), tipado e integrado à interface com suporte a simulação offline (`isSimulatedOffline`), essencial para testes automatizados e demonstrações.
- `AppState` + ouvintes de rede cobrem 99,5% das necessidades práticas de sincronização de campo sem depender de daemons de segundo plano que o Android e iOS frequentemente encerram para economizar bateria.

### Alternativas Consideradas
- **Migração para `expo-network`**: Avaliado conforme roadmap. Rejeitado para esta fase porque o `expo-network` não possui um listener nativo de mudança de conectividade tão maduro quanto o NetInfo, exigindo polling contínuo. A decisão é manter o NetInfo encapsulado no port `NetworkMonitor`.
- **`expo-background-task` / `expo-task-manager`**: Mantidos como gatilho secundário opcional de menor prioridade; o núcleo operacional depende estritamente dos gatilhos em primeiro plano e reconexão.

---

## 3. Implementação do Remote Gateway (Supabase atrás de Ports)

### Decisão
Criar `SupabaseRemoteSyncGateway` implementando a interface `RemoteSyncGateway` definida em `src/core/network/api-client.ts`:
- **`pushBatch(items: RemoteOutboxItem[])`**: Mapeia as operações da outbox local (`INSERT`, `UPDATE`, `DELETE`) para upserts e soft-deletes diretos nas tabelas do Supabase (`animals`, `bulls`, `inseminations`, `weighings`, `alerts`, `settings`). Cada operação envia `operation_id` para garantir idempotência.
- **`pullChanges(query: PullChangesQuery)`**: Realiza consultas filtradas por `farm_id` e ordenadas por `updated_at > sinceTimestamp` (ou `server_rev > sinceRev`), retornando lotes paginados com registros alterados e tombstones (`deleted_at is not null`).

### Rationale
- Cumpre a Regra de Dependência da Clean Architecture: `core/sync` e os use cases das features interagem apenas com `RemoteSyncGateway`. O SDK `@supabase/supabase-js` fica estritamente confinado em `src/core/network/supabase-remote-gateway.ts` e `src/features/account/infra/`.
- Permite que toda a suíte de testes unitários existente (35 suítes / 172 testes) continue rodando instantaneamente com `FakeRemoteSyncGateway` sem necessitar de mock complexo do Supabase.

### Alternativas Consideradas
- **Chamar Supabase diretamente nos use cases**: Rejeitado categoricamente (violação expressa da Constituição e da Regra de Dependências).
- **GraphQL / Apollo**: Rejeitado por adicionar complexidade e peso desnecessários ao bundle.

---

## 4. Multi-Tenant e Segurança em Nível de Linha (PostgreSQL RLS)

### Decisão
Estruturar o banco PostgreSQL no Supabase com particionamento estrito por `farm_id`:
- Tabelas: `farms`, `farm_members`, `animals`, `bulls`, `inseminations`, `weighings`, `alerts`, `settings`.
- Cada tabela possui colunas de sincronização: `id uuid primary key`, `farm_id uuid not null references farms(id)`, `created_at timestamptz not null`, `updated_at timestamptz not null`, `deleted_at timestamptz`, `server_rev bigint generated by default as identity`.
- Triggers automáticos no Postgres para atualizar `updated_at = clock_timestamp()`.
- **Políticas de Row Level Security (RLS)** em todas as tabelas:
  ```sql
  create policy "farm_isolation_policy" on public.animals
    for all using (
      farm_id in (
        select farm_id from public.farm_members
        where user_id = auth.uid() and deleted_at is null
      )
    );
  ```

### Rationale
- O multi-tenant no banco de dados assegura que mesmo que um cliente envie uma requisição forjada, o motor PostgreSQL impede o acesso a dados de outras fazendas.
- Índices compostos em `(farm_id, updated_at)` e `(farm_id, server_rev)` viabilizam pull incremental ultra-rápido (< 100ms para centenas de registros).

### Alternativas Consideradas
- **Schema por fazenda (Multi-Schema)**: Rejeitado por gerar manutenção inviável de migrations dinâmicas.
- **Confiança apenas em filtros na query do cliente**: Rejeitado por violar normas básicas de segurança e isolamento.

---

## 5. Criação Automática e Vinculação da Fazenda (Onboarding Silencioso)

### Decisão
Implementar a função PostgreSQL / RPC `sync_bootstrap_farm`:
1. Quando o usuário valida o OTP pela primeira vez, o app envia o `local_farm_id` atual (UUID já gerado no aparelho).
2. Se o usuário ainda não tiver nenhuma fazenda em `farm_members`:
   - A fazenda é criada na tabela `farms` com o `id = local_farm_id` e o usuário se torna `role = 'owner'` em `farm_members`.
   - Todos os registros da outbox local sobem normalmente para essa fazenda.
3. Se o usuário já tiver uma fazenda cadastrada na nuvem (ex.: entrou em um 2º aparelho):
   - A função retorna o `remote_farm_id` existente.
   - O aplicativo local adota o `remote_farm_id` e dispara a **Carga Inicial (Initial Pull)**.

### Rationale
- Elimina completamente passos burocráticos de criação de fazenda; o produtor simplesmente insere o e-mail e o código.

---

## 6. Tratamento de Conflito de Brinco Duplicado

### Decisão
- A estratégia geral de conflito em nível de registro continua sendo **Last-Write-Wins (LWW)** baseada no carimbo `updated_at` (UTC).
- Para o caso zootécnico específico de **brinco duplicado**:
  - Quando a rotina de `pull` receber um animal com `ear_tag` idêntico ao de outro animal ativo (`deleted_at is null`) da mesma fazenda com `id` diferente, ambos são mantidos no SQLite local.
  - O sistema sinaliza o registro na entidade com `ear_tag_conflict: true` e gera um alerta informativo no painel.
  - A interface exibe no cartão do animal o selo de status `aviso` com o texto "Conflito de Brinco", permitindo que o produtor abra a edição e altere o brinco sem perder o histórico do animal.

### Rationale
- No campo, dois vaqueiros podem atribuir temporariamente o mesmo brinco em lotes diferentes ou por erro de leitura. A deleção silenciosa de qualquer um dos dois causaria perda irreversível de genealogia e inseminações.
