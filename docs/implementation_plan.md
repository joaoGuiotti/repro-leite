# Implementation Plan V2: Manejo Reprodutivo e Bezerras

*Stack: React Native (Expo) + TypeScript + NativeWind (Tailwind CSS) + SQLite local + Supabase. Offline-first com backup automático na nuvem.*

## 1. Por que mudar do plano V1

O plano V1 era um PWA com IndexedDB e backup manual em JSON. Para o produtor rural isso tem três riscos:

- **Perda de dados:** o navegador (principalmente no iPhone) pode apagar IndexedDB/localStorage sem aviso. Se o celular quebrar ou for perdido, tudo se perde, a menos que o produtor lembre de exportar o JSON.
- **Backup depende de disciplina:** exportar manualmente não protege quem esquece.
- **Recursos nativos limitados:** notificações confiáveis (cio aos 21 dias, toque, parto), câmera, compartilhamento de arquivos e leitura de QR/RFID funcionam melhor em app nativo.

A V2 mantém **todas as regras de negócio da V1** (aleitamento, genealogia, recria, ciclo reprodutivo) e troca a base técnica: app nativo, banco SQLite local, login por conta e sincronização automática com a nuvem.

## 2. Decisões críticas

| Tema | Decisão |
| --- | --- |
| App | React Native com **Expo (development build)** e TypeScript. Não usar Expo Go em produção, pois o SQLite e o sync precisam de módulos nativos. |
| Banco local | **expo-sqlite** com **Drizzle ORM** (migrations versionadas e tipos fortes). Toda leitura e escrita da UI vai no banco local, nunca direto na nuvem. |
| Nuvem | **Supabase** (Postgres, Auth, Storage, Row Level Security) no plano gratuito, com backup diário via GitHub Actions. |
| Sincronização | Sync próprio e simples (fila de pendências + pull incremental). Alternativa: **PowerSync** (SQLite ↔ Supabase pronto) se quiser menos código. WatermelonDB também serve, mas exige mais configuração nativa. |
| IDs | **UUID v4** gerado no aparelho. Nunca número sequencial. |
| Conflitos | `updated_at` em todo registro e regra **"último que alterou vence"**. |
| Exclusão | **Soft delete** (`deleted_at`), senão a exclusão não sincroniza. |
| Login | E-mail com link/OTP ou telefone (SMS). Se o celular quebrar, basta logar em outro aparelho e os dados voltam. |
| Datas | Guardar datas de manejo como texto `YYYY-MM-DD` (sem horário), para evitar bugs de fuso horário nos prazos. Timestamps (`created_at`, `updated_at`) em UTC. |
| Idioma | Português (pt-BR) fixo na V1. |

## 3. Escopo do MVP

**Dentro da V1 do app:**

1. Cadastro de animais (brinco, nome, raça, nascimento, pai, mãe, avó materna).
2. Controle reprodutivo: inseminação em poucos toques, retorno do cio (21 dias), toque (45 dias), parto previsto (282 dias), secagem (parto menos 60 dias).
3. Bezerreiro: plano de aleitamento com desmame gradual, quadro "leite de hoje" com total de litros por ordenha.
4. Recria: pesagem mensal, GMD, meta de peso para a 1ª IA e transição de ciclo de vida.
5. Catálogo de touros e estoque de doses.
6. Alertas e notificações locais.
7. Login, sync automático, indicador de "última sincronização" e exportação CSV/PDF.

**Fase 2 (depois de validar com produtores):** produção diária de leite por vaca, sanidade (vacinas, tratamentos, carência de leite), fotos dos animais, leitura de QR code e RFID Bluetooth, papéis adicionais (vaqueiro, veterinário).

## 4. Experiência do usuário

### Navegação inferior (4 abas)

- **Hoje:** cios a vigiar, toques, partos, secagens, bezerras com troca de fase e total de litros do dia.
- **Bezerras:** fichas, genealogia, plano de leite e pesagens.
- **Reprodução:** registrar IA, status do rebanho e catálogo de touros.
- **Ajustes e Backup:** conta, status de sincronização, exportar dados, raças e metas de peso.

### Fluxos principais

1. **Nova bezerra:** brinco, nome, nascimento, peso ao nascer (padrão 40 kg), pai/mãe/avó. O app gera o cronograma completo de aleitamento com as datas de cada corte.
2. **Quadro do bezerreiro:** lista agrupada por fase, com litros da manhã e da tarde por bezerra e total do lote por ordenha.
3. **Ficha da novilha:** histórico de pesagens, GMD, alerta de peso-alvo e botão "Lançar 1ª Inseminação".
4. **Inseminação em 3 toques:** brinco, touro, data. Os alertas são criados sozinhos.
5. **Backup e sincronização:** indicador sempre visível (ex.: "Salvo na nuvem há 2 horas").

### Ergonomia rural

- Alvos de toque de no mínimo 48 px, preferencialmente 56 px nos botões principais.
- Alto contraste: verde pasto `#1b4332`, terra, âmbar para avisos, texto preto sobre fundo claro (legível sob sol forte).
- Teclado numérico para brinco e litros; busca de animal por brinco com poucos toques.
- Nenhuma tela exige internet. Mensagens de erro de rede nunca bloqueiam o registro.

### Estilização com Tailwind (NativeWind)

A UI usa classes Tailwind em React Native por meio do **NativeWind v4**, com o tema do app concentrado em um único `tailwind.config.js`.

- **Instalação:** `nativewind` e `tailwindcss` (o NativeWind v4 exige Tailwind 3.x; confirmar na documentação a versão compatível antes de instalar), mais `react-native-reanimated` e `react-native-safe-area-context`.
- **Configuração:** `tailwind.config.js` com o preset `nativewind/preset`, `global.css` importado em `app/_layout.tsx`, `metro.config.js` com `withNativeWind` e o preset no `babel.config.js`.
- **Tema como tokens:** cores do app (verde pasto `#1b4332`, terra, âmbar para avisos) definidas em `theme.extend.colors`, por exemplo `bg-pasto-900` e `text-ambar-700`. Nenhuma tela usa cor solta.
- **Alvos de toque:** botões principais com `min-h-14` (56 px) e demais controles com `min-h-12` (48 px), classes nativas do Tailwind, sem tamanho customizado.
- **Contraste:** tema claro fixo na V1, sem variantes `dark:`. Texto escuro sobre fundo claro, com contraste mínimo de 4,5:1 e meta de 7:1 nos textos principais, para leitura sob sol forte.
- **Componentes base em `src/ui`:** `Botao`, `CampoNumerico`, `Cartao`, `SeloStatus` e `IndicadorSync`, cada um com as classes já definidas. As telas montam a interface com esses componentes, e não com `className` repetido.
- **Classes estáticas:** não montar nomes de classe por concatenação (como `bg-${cor}-500`), pois o Tailwind não os detecta. Usar um mapa fixo por status, por exemplo `{ prenhe: 'bg-pasto-100', vazia: 'bg-ambar-100' }`.
- **Limites do Tailwind no nativo:** layout com flexbox (sem CSS grid), sem `hover:`. Listas longas usam `FlatList` ou `FlashList`; validar a fluidez em Android de entrada.

## 5. Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│           App React Native (Expo) - UI                  │
│  Hoje | Bezerras | Reprodução | Ajustes e Backup        │
└───────────────────────┬─────────────────────────────────┘
                        │ hooks / casos de uso
┌───────────────────────▼─────────────────────────────────┐
│     Motores de regras (TypeScript puro, testados)       │
│  reprodução | aleitamento | recria | genealogia         │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│   SQLite local (expo-sqlite + Drizzle)  ← fonte da UI   │
│   tabela sync_queue (alterações pendentes)              │
└───────────────────────┬─────────────────────────────────┘
                        │ quando há internet (background)
┌───────────────────────▼─────────────────────────────────┐
│   Camada de Sync (push da fila + pull incremental)      │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────┐
│ Supabase: Auth | Postgres (RLS) | Storage | Backups     │
└─────────────────────────────────────────────────────────┘
```

### Princípios

- **Offline-first de verdade:** a UI só conversa com o SQLite local.
- **Regras de negócio isoladas** em funções puras de TypeScript (sem dependência de React ou banco). Isso permite testes automatizados e reaproveitamento.
- **Multi-fazenda desde o início:** toda tabela tem `farm_id`. Hoje um usuário tem uma fazenda, mas isso evita refazer o banco quando entrar multiusuário.

### Estrutura de pastas sugerida

```
app/                  # rotas (Expo Router)
  (tabs)/hoje.tsx
  (tabs)/bezerras/
  (tabs)/reproducao/
  (tabs)/ajustes.tsx
src/
  domain/             # regras puras + testes
    reproduction.ts
    calfMilkPlan.ts
    growth.ts
    lifecycle.ts
  db/                 # schema Drizzle, migrations, repositórios
  sync/               # push, pull, fila, controle de conectividade
  notifications/      # agendamento de alertas locais
  export/             # CSV, PDF, compartilhamento
  ui/                 # componentes com className Tailwind (botões grandes); tema em tailwind.config.js
  auth/
```

## 6. Regras de negócio (motores)

Todas as regras abaixo vêm do plano V1 e devem ser **parametrizáveis** em Ajustes, porque variam por fazenda e por orientação veterinária.

### 6.1 Ciclo reprodutivo

- IA + 21 dias: vigiar retorno do cio.
- IA + 45 dias: toque/diagnóstico de gestação.
- IA + 282 dias: parto previsto.
- Parto previsto menos 60 dias: secagem.
- Se o toque for negativo ou houver retorno ao cio, a vaca volta para "vazia" e os alertas pendentes daquela IA são cancelados.

### 6.2 Plano de aleitamento

Idade em dias = `hoje - data_nascimento`.

| Idade (dias) | Manhã | Tarde | Total/dia | Fase |
| --- | --- | --- | --- | --- |
| 0 a 15 | 2 L | 2 L | 4 L | inicial |
| 16 a 100 | 4 L | 4 L | 8 L | pico |
| 101 a 107 | 2 L | 2 L | 4 L | corte semana 1 |
| 108 a 114 | 1 L | 1 L | 2 L | corte semana 2 |
| 115 a 121 | 1 L | 0 | 1 L | corte semana 3 |
| 122 ou mais | 0 | 0 | 0 | desmamada |

O app calcula e exibe as **datas de calendário** de cada transição (nascimento + 16, + 101, + 108, + 115, + 122) e o que a bezerra mama **hoje**. Os litros por fase ficam em tabela de configuração, para o produtor poder ajustar.

> **Validado:** volumes e prazos confirmados pelo veterinário da fazenda. O motor conta o dia do nascimento como dia 0, como na tabela.

### 6.3 Recria

- GMD (g/dia) = `(pesoAtual - pesoAnterior) / diasDecorridos`, convertido para gramas.
- Meta de peso para 1ª IA configurável por raça (referência do plano V1: cerca de 350 a 380 kg aos 14 a 16 meses).
- Alerta "apta para IA" quando atingir o peso-alvo (e idade mínima configurável).
- Lembrete mensal de pesagem para bezerras desmamadas e novilhas.

### 6.4 Ciclo de vida

`lactante → desmamada → recria → novilha_apta_ia → novilha_prenhe → adulta` (vaca de 1ª cria).

As transições automáticas (lactante para desmamada no dia 122, por exemplo) são calculadas pelo motor. As transições que dependem de decisão humana (apta para IA, prenhe) pedem confirmação do usuário.

### 6.5 Genealogia

- Pai (touro da IA ou texto livre), mãe (animal do rebanho) e avó materna; avós paternos opcionais.
- Mãe e avó podem ser vínculos para animais cadastrados ou texto, quando o animal não está no app.
- Aviso simples de **consanguinidade** ao registrar IA: se o touro for pai ou avô da vaca, exibir alerta amarelo.

## 7. Modelo de dados (SQLite local e Postgres)

Campos comuns a **todas** as tabelas:

`id` (UUID), `farm_id` (UUID), `created_at`, `updated_at`, `deleted_at` (nulo se ativo), `device_id` (opcional, para depuração).

### Tabelas

1. **farms:** `name`, `owner_user_id`.
2. **animals** (vacas, novilhas e bezerras na mesma tabela):
   - `ear_tag`, `name`, `breed`, `sex`, `birth_date`, `birth_weight_kg`
   - `sire_id` / `sire_name`, `dam_id` / `dam_name`, `maternal_granddam_id` / `maternal_granddam_name`
   - `life_stage` (`lactante`, `desmamada`, `recria`, `novilha_apta_ia`, `novilha_prenhe`, `adulta`)
   - `repro_status` (`vazia`, `inseminada`, `prenhe`, `seca`)
   - `photo_path`, `notes`
3. **inseminations:** `animal_id`, `date`, `bull_id` / `bull_name`, `inseminator`, `expected_heat_date`, `pregnancy_check_date`, `expected_calving_date`, `dry_off_date`, `result` (`pendente`, `prenhe`, `vazia`), `notes`.
4. **weighings:** `animal_id`, `date`, `weight_kg`, `notes`.
5. **bulls:** `name`, `breed`, `straws_in_stock`, `notes`.
6. **alerts:** `target_animal_id`, `type` (`observar_cio`, `toque`, `parto`, `secagem`, `trocar_fase_leite`, `desmame`, `pesar`), `due_date`, `completed_at`, `source_id` (ex.: id da inseminação que originou).
7. **settings:** parâmetros por fazenda (plano de leite, metas de peso por raça, dias de cio/toque/gestação).
8. **sync\_queue (apenas local):** `id`, `table`, `record_id`, `operation`, `created_at`, `attempts`, `last_error`.
9. **sync\_state (apenas local):** `last_pulled_at`, `last_pushed_at`, `last_success_at`.

**Fase 2:** `milk_yields`, `health_events` (vacinas, tratamentos, carência), `attachments`.

### Boas práticas

- Índices em `farm_id`, `ear_tag`, `animal_id`, `due_date` e `updated_at`.
- Brinco único por fazenda apenas entre animais ativos (índice único parcial; regra completa em "Política de reuso de brincos").
- Alertas derivados (cio, toque, parto) podem ser **recalculados** a partir da IA, o que evita divergência se alguma regra mudar.

### Política de reuso de brincos (FR-003)

**Decisão:** o brinco pode ser reutilizado somente se nenhum animal ativo da fazenda o estiver usando. O rebanho ativo nunca tem duplicidade, e o histórico dos animais antigos continua intacto.

- **Animal inativo e animal excluído são coisas diferentes.** Vendido, descartado ou morto é uma *saída* do rebanho: o animal mantém todo o histórico. `deleted_at` fica só para cadastro feito por engano. As duas situações liberam o brinco.
- **Novos campos em `animals`:** `exit_status` (`ativo`, `vendido`, `descartado`, `morto`), `exit_date`, `exit_reason` e `ear_tag_normalized` (brinco sem espaços e em maiúsculas, para comparar `a12` com `A 12`).
- **Índice único parcial**, igual no SQLite e no Postgres: único em (`farm_id`, `ear_tag_normalized`) onde `deleted_at` é nulo e `exit_status` é `ativo`.
- **Genealogia e inseminações usam o `id` (UUID) do animal, nunca o brinco.** Reusar um número não troca pai, mãe ou avó de ninguém.

**Comportamento na tela de cadastro:**

1. Brinco usado por animal **ativo**: bloqueia e mostra "Brinco 123 já está em uso pela vaca Mimosa", com atalho para a ficha dela.
2. Brinco que pertenceu a animal **inativo ou excluído**: aviso amarelo, por exemplo "Brinco 123 foi da vaca Mimosa (vendida em 03/2025). Usar de novo?", com os botões *Usar mesmo assim* e *Mudar número*.
3. Brinco inédito: segue normalmente.

**Exibição e busca:** a busca por brinco lista os animais ativos primeiro e depois os inativos, com o selo "inativa" e o ano de saída. Na árvore genealógica, o animal antigo aparece com brinco, nome e esse selo, então "123" nunca fica ambíguo.

**Conflito offline:** dois aparelhos podem cadastrar o mesmo brinco sem internet. No sync, o Postgres rejeita o segundo por violar a unicidade, e a regra "último que alterou vence" não resolve isso. Tratamento: o registro mais antigo fica; o outro permanece no aparelho marcado como "conflito de brinco", sem perda de dados, e a aba Hoje pede que o usuário informe um novo número. As atualizações do animal em conflito só sobem depois da correção.

**Reativar animal:** se uma saída foi lançada por engano e o brinco já foi reutilizado, o app exige trocar um dos dois brincos antes de reativar.

**Testes obrigatórios:** brinco ativo duplicado bloqueado; reuso após venda permitido com aviso; reativação com brinco ocupado; conflito de brinco entre dois aparelhos offline; busca mostrando ativos antes dos inativos.

## 8. Estratégia de sincronização

### Escrita local

Toda alteração, em uma única transação SQLite: grava o registro com novo `updated_at` e insere uma linha em `sync_queue`.

### Push (aparelho → nuvem)

1. Gatilhos: app volta ao primeiro plano, internet reconectada, após cada salvamento (com debounce) e tarefa em segundo plano periódica (`expo-background-task` / `expo-task-manager`).
2. Envia a fila em lotes por **upsert** (idempotente, pode repetir sem duplicar).
3. Só remove da fila após confirmação do servidor; falhas usam backoff exponencial.

### Pull (nuvem → aparelho)

1. Busca registros com `server_updated_at > last_pulled_at`, página por página.
2. Aplica a regra **último a alterar vence** comparando `updated_at`.
3. Registros com `deleted_at` preenchido são marcados como apagados localmente.

### Detalhes importantes

- Usar `server_updated_at` (preenchido por trigger no Postgres) para o cursor do pull, evitando problemas de relógio errado no celular. Usar o `updated_at` do cliente apenas para resolver conflito.
- Validar relógio do aparelho: se a data do celular estiver muito fora do horário do servidor, avisar o usuário.
- Primeiro login em aparelho novo: **restauração completa** (pull de tudo) com barra de progresso.
- Se o aparelho ficar muito tempo sem sincronizar, mostrar alerta amarelo/vermelho no indicador.

### Segurança (Supabase)

- **Row Level Security** em todas as tabelas: o usuário só acessa linhas cujo `farm_id` pertence a ele (tabela `farm_members` já no MVP, para dono e inseminador).
- Chave `anon` no app; **nunca** a `service_role`.
- Armazenar sessão com `expo-secure-store`.
- Termo de privacidade (LGPD) simples no primeiro acesso.

### Sem API própria: o app fala direto com o Supabase

O MVP não precisa de servidor ou API criada por nós. O Supabase expõe uma API REST sobre as tabelas do Postgres, e o app a usa pelo `@supabase/supabase-js`, protegida pelo RLS. Não há backend para manter, hospedar ou pagar.

- **Sync:** `upsert` em lote (push) e consulta por `server_updated_at` (pull), direto no supabase-js.
- **`server_updated_at`:** preenchido por trigger no Postgres.
- **Login:** Supabase Auth, com código OTP por e-mail.
- **Backup:** GitHub Actions, fora do app.
- **Chave `service_role`:** nunca vai no app, nem no repositório do app.

### Convite do inseminador por código (função RPC)

O convite exige uma regra que o app sozinho não pode executar com segurança, então ela fica em funções SQL (RPC) no próprio Supabase, ainda sem API separada.

1. O dono toca em "Convidar inseminador" (precisa estar online). O app chama `create_invite()`, que confere se o usuário é dono da fazenda, gera um código aleatório de 8 caracteres, com validade de 48 horas e uso único, e grava apenas o hash do código em `farm_invites`.
2. O dono passa o código ao primo, por WhatsApp, por exemplo.
3. O primo faz login por e-mail e digita o código. O app chama `accept_invite(code)`, que valida código, validade e uso, adiciona o usuário em `farm_members` com o papel de colaborador e marca o convite como usado.
4. O app do primo faz a restauração completa (pull) e ele passa a ver os dados da fazenda.

Regras de segurança dessas funções:

- Funções `SECURITY DEFINER` com `search_path` fixo, e a tabela `farm_invites` sem acesso direto pelo RLS (só pelas funções).
- Limite de tentativas de código por usuário, para impedir adivinhação.
- O dono remove um membro marcando `farm_members` como apagado (soft delete). O RLS passa a bloquear o acesso na hora, mas os dados que já estão no celular dele permanecem lá.

### Quando uma API ou Edge Function passaria a ser necessária

Nenhum desses casos está no MVP: envio de convite por e-mail pelo servidor, integração com sistemas externos (balança, laticínio, WhatsApp), relatórios pesados que não devem rodar no celular e regras que não podem ficar no aparelho. Nesses casos, usar Edge Functions do Supabase antes de montar um servidor próprio.

## 9. Backup e proteção contra perda

1. **Login por conta** (e-mail ou telefone): dados voltam em qualquer aparelho.
2. **Sync automático** em segundo plano sempre que há internet.
3. **Indicador visível** em todas as abas: "Salvo na nuvem há 2 horas" (verde), "Pendente: 12 alterações" (amarelo), "Sem sincronizar há 7 dias" (vermelho).
4. **Backup extra do usuário:** exportar CSV e PDF (`expo-print`, `expo-file-system`) e compartilhar por WhatsApp ou Google Drive (`expo-sharing`). Manter também a exportação/importação JSON da V1 como plano C.
5. **Backup agendado no servidor:** o plano gratuito do Supabase não inclui backups diários, então o backup é feito por um workflow agendado do GitHub Actions, sem custo (detalhado na subseção abaixo).
6. **Fotos:** comprimir (`expo-image-manipulator`, lado maior de cerca de 1280 px) antes de enviar e enviar **somente no Wi-Fi** (`expo-network`), com opção de liberar dados móveis.
7. **Teste de restauração:** incluir no checklist de cada release um teste de "apagar app, logar de novo e conferir os dados".

### Backup diário gratuito com GitHub Actions

Um workflow roda todo dia, gera um dump do banco com `pg_dump` e guarda o arquivo por 30 dias. O custo é zero, e a atividade diária também evita a pausa do projeto gratuito do Supabase por inatividade.

1. **Repositório privado** `backup-rebanho` no GitHub. Nunca público, pois o dump contém dados da fazenda.
2. **Secret** `SUPABASE_DB_URL` com a connection string do banco. Usar a string do pooler em modo sessão (IPv4), porque os runners do GitHub não alcançam a conexão direta IPv6; confirmar a string correta em Connect, no painel do Supabase. Idealmente com um usuário de banco só de leitura.
3. **Workflow** em `.github/workflows/backup.yml`:

```yaml
name: backup-diario
on:
  schedule:
    - cron: '0 6 * * *'   # 03:00 no horário de Brasília
  workflow_dispatch:       # permite rodar manualmente
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Instalar cliente PostgreSQL
        run: sudo apt-get update && sudo apt-get install -y postgresql-client
      - name: Gerar dump
        env:
          DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: pg_dump "$DB_URL" --no-owner --no-privileges --schema=public -Fc -f rebanho-$(date +%F).dump
      - uses: actions/upload-artifact@v4
        with:
          name: rebanho-dump
          path: rebanho-*.dump
          retention-days: 30
```

4. **Versão do cliente:** o `pg_dump` precisa ser da mesma versão do Postgres do Supabase ou mais nova. Se o job falhar por incompatibilidade, instalar o `postgresql-client` da versão correta pelo repositório oficial do PostgreSQL.
5. **Aviso de falha:** o GitHub envia e-mail quando um workflow falha. Manter essa notificação ativa.
6. **Cópia extra (opcional):** uma vez por semana, enviar o dump para o Google Drive ou para o Cloudflare R2 com `rclone`, ambos com camada gratuita.
7. **Teste de restauração mensal:** baixar o último dump e rodar `pg_restore` em um banco de teste (outro projeto gratuito do Supabase ou Postgres local), conferindo o número de animais e de inseminações.

O dump cobre o schema `public` (os dados da fazenda). Os usuários ficam no schema `auth`; em caso de desastre, eles se recriam pelo login por e-mail e o vínculo com a fazenda é refeito pelo convite.

### Alternativas gratuitas avaliadas ao Supabase

O Supabase continua como escolha porque entrega login, regras de acesso (RLS) e API prontos, o que reduz o trabalho de quem desenvolve sozinho; o único item que falta no plano gratuito, o backup diário, é coberto pelo workflow acima. Consulta feita em 13/10/2026.

| Opção | Plano gratuito | Backup grátis | Esforço para o app |
| --- | --- | --- | --- |
| **Supabase** (escolhido) | 500 MB de banco, 1 GB de arquivos, 50 mil usuários ativos por mês; pausa após 7 dias sem uso ([fonte](https://focusreactive.com/blog/supabase-price/)) | Não inclui backup diário; coberto pelo GitHub Actions | Baixo: Auth, RLS e API prontos |
| Cloudflare D1 | 500 MB por banco, 5 GB por conta ([fonte](https://developers.cloudflare.com/d1/platform/limits/)) | Time Travel de 7 dias, automático ([fonte](https://developers.cloudflare.com/d1/reference/time-travel/)) | Alto: Workers, login e sync próprios |
| Turso | 5 GB e 100 bancos, sem cartão de crédito ([fonte](https://freetier.co/alternatives/cloudflare-d1)) | Restauração pontual de 1 dia | Alto: login e sync próprios |
| Firebase Firestore (Spark) | 1 GiB e 20 mil escritas por dia ([fonte](https://freetier.co/alternatives/cloudflare-d1)) | Não confirmado; conferir antes de decidir | Médio: cache offline pronto, mas sem SQL para relatórios |
| PocketBase ou Postgres próprio | Depende do servidor (VPS), em geral com custo | Configurado por você | Médio, com custo de servidor |

Se o projeto passar dos limites gratuitos ou o produtor quiser backup gerenciado, o plano Pro do Supabase (US$ 25 por mês) inclui backups diários com retenção de 7 dias e não pausa por inatividade ([fonte](https://focusreactive.com/blog/supabase-price/)). A troca não exige mudar o app, pois o código continua o mesmo.

## 10. Alertas e notificações

- `expo-notifications` com **notificações locais agendadas**, que funcionam sem internet.
- Ao criar ou alterar uma IA, reagendar os alertas daquele animal (cio, toque, parto, secagem).
- Resumo diário configurável (ex.: 6h): "3 vacas para vigiar cio, 1 toque, 12 L extra de leite hoje".
- Reagendar tudo após sincronização que traga alterações de outro aparelho.
- A aba **Hoje** é a fonte principal, e as notificações são reforço.

## 11. Stack e bibliotecas

| Função | Biblioteca |
| --- | --- |
| Framework | Expo SDK atual + Expo Router + NativeWind v4 (Tailwind CSS) para estilização |
| Linguagem | TypeScript (modo estrito) |
| Banco local | `expo-sqlite` + `drizzle-orm` + `drizzle-kit` |
| Nuvem | `@supabase/supabase-js` |
| Estado/consulta | TanStack Query (cache de leituras) + hooks próprios sobre o SQLite |
| Formulários | React Hook Form + Zod |
| Datas | `date-fns` (somente datas sem horário nas regras de manejo) |
| Conectividade | `expo-network` |
| Segundo plano | `expo-background-task`, `expo-task-manager` |
| Notificações | `expo-notifications` |
| Export | `expo-print`, `expo-file-system`, `expo-sharing` |
| Segurança | `expo-secure-store` |
| Gráficos | `victory-native` ou `react-native-svg` simples (GMD) |
| Ícones | `lucide-react-native` (com `react-native-svg`) para iconografia rural |
| Testes | Jest (regras de domínio), Maestro ou Detox (fluxos principais) |
| Build/Distribuição | EAS Build, EAS Update, Google Play (Android primeiro) |

**Prioridade de plataforma:** Android primeiro (maioria no campo, incluindo aparelhos baratos e antigos). iOS depois, sem mudar a base de código.

## 12. Plano de implementação por etapas

### Etapa 0: Preparação (2 a 3 dias)

- Criar projeto Expo com TypeScript, ESLint, Prettier e EAS.
- Criar projeto Supabase, definir esquema inicial e políticas RLS. Criar o repositório privado de backup e deixar o workflow diário rodando desde o primeiro dia de dados.
- Instalar e configurar NativeWind e Tailwind (tailwind.config.js, global.css, metro e babel) e definir o tema (cores, tamanhos de botão, tipografia) como tokens do Tailwind.

### Etapa 1: Núcleo offline (1 a 2 semanas)

- Schema Drizzle, migrations e repositórios.
- Cadastro e listagem de animais com busca por brinco.
- Motores de regras em `src/domain` com **testes unitários** cobrindo todas as faixas do aleitamento, ciclos de 21/45/282 dias e GMD.

### Etapa 2: Reprodução (1 semana)

- Fluxo de IA em 3 toques, catálogo de touros e estoque de doses.
- Geração de alertas, toque, resultado e secagem.
- Aba Hoje com alertas do dia.

### Etapa 3: Bezerreiro e recria (1 a 2 semanas)

- Ficha da bezerra com genealogia e cronograma de leite.
- Quadro do bezerreiro com total de litros por ordenha.
- Pesagens, GMD, gráfico, alerta de peso-alvo e botão "Lançar 1ª IA".

### Etapa 4: Conta, sync e backup (2 semanas)

- Login por e-mail (código OTP, SMTP próprio) e armazenamento seguro da sessão. Convite do inseminador por código: tabelas farm\_members (papéis dono e colaborador, ambos com leitura e escrita nos dados da fazenda) e farm\_invites, com as funções RPC create\_invite e accept\_invite, e teste do fluxo completo com dois aparelhos.
- Fila de sync, push, pull incremental, restauração em aparelho novo.
- Indicador de última sincronização e estados de erro.
- Exportação CSV/PDF/JSON e compartilhamento. Teste do workflow de backup e primeira restauração de dump em banco de teste.
- Testes de cenário: 2 aparelhos, edição offline em ambos, exclusão, restauração.

### Etapa 5: Notificações, polimento e piloto (1 a 2 semanas)

- Notificações locais e resumo diário.
- Revisão de acessibilidade no sol, tamanho de fonte e botões.
- Piloto em 1 ou 2 fazendas por 4 semanas, coletando feedback.
- Publicação em teste fechado na Google Play.

### Fase 2 (após o piloto)

Produção de leite, sanidade e carência, fotos, QR/RFID, papéis adicionais, relatórios (dias abertos, taxa de prenhez, intervalo entre partos).

**Estimativa total do MVP:** 7 a 10 semanas para um desenvolvedor, variando com a experiência em Expo e Supabase.

## 13. Critérios de aceite do MVP

- [ ] Todas as telas de manejo funcionam em modo avião, com dados persistidos após fechar o app.
- [ ] Registrar uma IA leva no máximo 3 toques após abrir a aba Reprodução e gera os 4 alertas corretos.
- [ ] O quadro do bezerreiro mostra litros corretos para cada faixa de idade e o total por ordenha.
- [ ] Ao religar a internet, as alterações feitas offline chegam à nuvem sem ação do usuário.
- [ ] Logar em um aparelho novo restaura 100% dos dados, incluindo exclusões.
- [ ] Edição offline em dois aparelhos converge para o mesmo estado após sincronizar.
- [ ] O indicador de última sincronização está sempre visível e correto.
- [ ] Exportação CSV/PDF abre e compartilha pelo WhatsApp. O backup diário roda sem erro e um dump foi restaurado com sucesso em banco de teste.
- [ ] Testes unitários dos motores de regras passam (100% das faixas de leite e prazos).
- [ ] App abre e é utilizável em Android de entrada (2 a 3 GB de RAM).

## 14. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Conflitos de edição entre aparelhos | UUID, `updated_at`, regra simples de último vence, log de conflitos descartados na Fase 2 |
| Relógio do celular errado | Cursor de pull por `server_updated_at` e aviso de relógio fora do horário |
| Tarefas em segundo plano limitadas pelo Android | Sync também ao abrir o app, ao voltar à tela e ao reconectar; não depender só do segundo plano |
| Usuário não percebe que não está protegido | Indicador colorido e notificação se ficar vários dias sem sincronizar |
| Regras de manejo diferentes por fazenda | Parâmetros editáveis em Ajustes e validação com veterinário |
| Custos e limites da nuvem | Plano gratuito tem 500 MB de banco, 1 GB de arquivos e pausa após 7 dias sem uso. Sync diário e o job de backup mantêm o projeto ativo; fotos comprimidas; conferir o uso todo mês |
| Perda do acesso à conta | Login por e-mail e telefone, recuperação de conta e exportação JSON como plano C |

## 15. Migração do plano V1

- Se já existir dado no PWA, usar o **JSON exportado** da V1 e criar uma tela de importação que converte para o novo esquema (gerando UUIDs e vínculos de genealogia).
- Reaproveitar integralmente as regras e os testes dos motores da V1, traduzindo para `src/domain`.
- A interface web da V1 pode servir como protótipo visual de referência.

## 16. Decisões confirmadas

1. Escala: cerca de 200 vacas, 1 fazenda e 2 usuários (dono e inseminador). Esse volume cabe no SQLite local e no plano gratuito do Supabase sem otimização especial.
2. Desenvolvimento: solo, feito pelo próprio produtor. Por isso o escopo do MVP fica enxuto e a Fase 2 só começa depois do piloto.
3. Login: e-mail, sem custo de SMS. Usar código de 6 dígitos (OTP) enviado por e-mail, que dispensa deep link. Configurar SMTP próprio antes do piloto, pois o envio padrão do Supabase tem limite baixo.
4. Aleitamento: volumes e prazos já validados com o veterinário.
5. Inseminador: é da fazenda (primo do produtor). Entra como membro da mesma fazenda, com conta e login próprios e papel de colaborador.

## 17. Plano de implementação detalhado (passo a passo)

Esta seção detalha a seção 12 em tarefas, para quem desenvolve sozinho. **Mudança de ordem:** o sync é antecipado para a Sprint 2, com apenas a tabela de animais, porque é a parte de maior risco. Depois, cada nova tabela criada já nasce com seu sync, RLS e teste em dois aparelhos. Onde esta seção divergir da seção 12, vale esta.

Ritmo sugerido: sprints de 1 a 1,5 semana, com um commit por tarefa e um aparelho Android de entrada sempre disponível para testar.

### Primeiros passos (o que fazer hoje)

1. Criar o repositório privado do app e o projeto Expo com TypeScript e Expo Router.
2. Criar o projeto no Supabase e anotar a URL e a chave `anon`.
3. Criar o repositório privado `backup-rebanho` e o secret `SUPABASE_DB_URL`.
4. Rodar o app em um celular Android físico com um development build.
5. Instalar e configurar o NativeWind e as 4 abas vazias.
6. Escrever o primeiro teste do motor de aleitamento (idade 16 dias retorna 4 L + 4 L).

### Sprint 0: fundação (2 a 3 dias)

- [ ] Projeto Expo com TypeScript estrito, ESLint, Prettier e Jest.
- [ ] Instalar `expo-sqlite`, `drizzle-orm`, `drizzle-kit`, `@supabase/supabase-js`, `expo-secure-store`, `expo-network`, `nativewind` e `tailwindcss` 3.x (conferir as versões na documentação de cada um).
- [ ] Configurar NativeWind: `tailwind.config.js`, `global.css`, `metro.config.js` e `babel.config.js`.
- [ ] Tema Tailwind (verde pasto, terra, âmbar) e componentes `Botao`, `Cartao` e `CampoNumerico`.
- [ ] Navegação inferior com as 4 abas (Hoje, Bezerras, Reprodução, Ajustes).
- [ ] Variáveis de ambiente `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Workflow de backup criado e executado manualmente uma vez.

**Pronto quando:** o app abre no celular com as 4 abas, o Jest roda e o workflow de backup executa sem erro.

### Sprint 1: domínio e banco local (1 a 1,5 semana)

- [ ] `src/domain`: `reproduction.ts` (21, 45 e 282 dias e secagem), `calfMilkPlan.ts` (faixas 0 a 15, 16 a 100, 101 a 107, 108 a 114, 115 a 121 e 122 ou mais, com as datas de transição), `growth.ts` (GMD e peso-alvo) e `lifecycle.ts`, todos com testes cobrindo cada faixa e as bordas.
- [ ] Schema Drizzle e migrations: `farms`, `animals` (com `exit_status` e `ear_tag_normalized`), `bulls`, `inseminations`, `weighings`, `alerts`, `settings`, `sync_queue` e `sync_state`.
- [ ] Campos comuns em tudo: UUID, `farm_id`, `created_at`, `updated_at` e `deleted_at`.
- [ ] Índice único parcial do brinco, conforme a política de reuso.
- [ ] Camada de repositório: cada escrita grava o registro e a linha em `sync_queue` na mesma transação.
- [ ] Telas de cadastro, lista e busca de animais por brinco, com os avisos de brinco ativo e de brinco de animal inativo.
- [ ] Parâmetros editáveis em Ajustes (plano de leite, dias de cio, toque e gestação, meta de peso por raça).

**Pronto quando:** em modo avião dá para cadastrar, buscar e editar animais, os dados persistem ao fechar o app e todos os testes de domínio passam.

### Sprint 2: conta e sync com a tabela de animais (1,5 semana)

- [ ] Postgres: tabelas `farms`, `farm_members` e `animals`, trigger de `server_updated_at` e políticas RLS por `farm_id`.
- [ ] Login por e-mail com código OTP, SMTP próprio e sessão no `expo-secure-store`.
- [ ] Criação automática da fazenda no primeiro login.
- [ ] Push em lote (`upsert`) e pull incremental por `server_updated_at`, só para animais.
- [ ] Gatilhos de sync: abrir o app, voltar para o primeiro plano, reconexão, após salvar e tarefa em segundo plano.
- [ ] Indicador de última sincronização (verde, amarelo e vermelho) visível em todas as abas.
- [ ] Restauração completa em aparelho novo, com barra de progresso.
- [ ] Tratamento do conflito de brinco no sync (registro marcado como "conflito de brinco" e pedido de novo número).
- [ ] Teste com 2 aparelhos: edição offline nos dois, exclusão, brinco duplicado e restauração após apagar o app.

**Pronto quando:** um animal criado no aparelho A aparece no B, o conflito de brinco é resolvido sem perda de dados e o login em aparelho novo traz tudo de volta.

### Sprint 3: reprodução (1 semana)

- [ ] Tabelas `bulls`, `inseminations` e `alerts` no Postgres, com RLS e sync (padrão da Sprint 2).
- [ ] Cadastro de touros e estoque de doses.
- [ ] Fluxo de IA em 3 toques (brinco, touro, data), com baixa automática da dose.
- [ ] Geração dos alertas: retorno do cio, toque, parto e secagem.
- [ ] Registro do resultado do toque e regras: prenhe segue; vazia volta para "vazia" e cancela os alertas daquela IA.
- [ ] Aviso de consanguinidade ao registrar IA.
- [ ] Aba Hoje com os alertas do dia, atrasados e próximos.
- [ ] Teste de sync com 2 aparelhos para as novas tabelas.

**Pronto quando:** registrar uma IA gera os 4 alertas corretos, aparecem na aba Hoje e sincronizam entre os aparelhos.

### Sprint 4: bezerreiro e recria (1,5 semana)

- [ ] Cadastro da bezerra com genealogia (pai, mãe e avó materna, por vínculo ou texto livre) e peso ao nascer.
- [ ] Cronograma de aleitamento com as datas exatas de cada corte e o que a bezerra mama hoje.
- [ ] Quadro do bezerreiro agrupado por fase, com o total de litros por ordenha (manhã e tarde).
- [ ] Alertas de troca de fase e de desmame.
- [ ] Tabela `weighings` com sync, tela de pesagem mensal, GMD e gráfico simples.
- [ ] Alerta de peso-alvo e botão "Lançar 1ª Inseminação".
- [ ] Transições do ciclo de vida: automáticas (lactante para desmamada) e com confirmação (apta para IA, prenhe, adulta).
- [ ] Teste de sync com 2 aparelhos e conferência dos litros do quadro com a tabela de aleitamento.

**Pronto quando:** o quadro do bezerreiro mostra os litros certos para cada faixa de idade e o total por ordenha, e uma novilha pesada vira "apta para IA" no peso-alvo.

### Sprint 5: convite, backup e exportação (1 semana)

- [ ] Tabela `farm_invites` e funções `create_invite` e `accept_invite` (hash do código, validade de 48 horas, uso único e limite de tentativas).
- [ ] Telas "Convidar inseminador" e "Entrar com código".
- [ ] Remoção de membro por soft delete em `farm_members`.
- [ ] Exportação CSV, PDF e JSON, com compartilhamento por WhatsApp e Google Drive.
- [ ] Importação do JSON, como plano C de restauração.
- [ ] Primeira restauração de um dump do backup em um banco de teste.
- [ ] Teste do fluxo completo do convite com dois aparelhos.

**Pronto quando:** seu primo entra com o código, registra uma IA no aparelho dele e você a vê no seu, e um dump do backup foi restaurado com sucesso.

### Sprint 6: alertas, polimento e build (1 a 1,5 semana)

- [ ] Notificações locais agendadas, com reagendamento após criar, editar ou sincronizar.
- [ ] Resumo diário configurável.
- [ ] Revisão de acessibilidade: contraste ao sol, tamanho de fonte e alvos de toque de 48 a 56 px.
- [ ] Teste em Android de entrada (2 a 3 GB de RAM) e ajuste de desempenho das listas.
- [ ] Termo de privacidade (LGPD) simples no primeiro acesso.
- [ ] Build de produção com EAS e publicação em teste fechado na Google Play (ou APK direto para o piloto).
- [ ] Passar o checklist de aceite da seção 13.

**Pronto quando:** todos os critérios de aceite do MVP passam em aparelho real.

### Sprint 7: piloto (4 semanas)

- [ ] Usar o app na fazenda em paralelo ao caderno por 2 semanas, depois sozinho.
- [ ] Conferir toda semana: alertas disparados, litros do bezerreiro, indicador de sincronização e e-mail de falha do backup.
- [ ] Anotar problemas e pedidos por escrito, priorizando o que atrapalha o trabalho no curral.
- [ ] Ao fim do piloto, decidir o que entra na Fase 2: produção de leite, sanidade e carência, fotos, QR/RFID e relatórios.

### Calendário resumido

| Etapa | Duração |
| --- | --- |
| Sprint 0: fundação | 2 a 3 dias |
| Sprint 1: domínio e banco local | 1 a 1,5 semana |
| Sprint 2: conta e sync | 1,5 semana |
| Sprint 3: reprodução | 1 semana |
| Sprint 4: bezerreiro e recria | 1,5 semana |
| Sprint 5: convite, backup e exportação | 1 semana |
| Sprint 6: alertas, polimento e build | 1 a 1,5 semana |
| **Total até o piloto** | **cerca de 7 a 9 semanas** |
| Sprint 7: piloto | 4 semanas |

### Regras de trabalho para o desenvolvimento solo

- **Toda tabela nova** nasce com campos comuns, RLS, sync e teste em 2 aparelhos antes de seguir para a próxima funcionalidade.
- **Regra de manejo** só entra no app depois de ter teste unitário no `src/domain`.
- **Nada de rede na UI:** as telas só leem e gravam no SQLite local.
- **A cada sprint**, rodar o teste de restauração (apagar o app, logar de novo e conferir os dados).
- **Escopo travado:** o que não está nesta lista vai para o backlog da Fase 2, e não para o meio da sprint.
