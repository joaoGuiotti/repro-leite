# Quickstart & Validation Guide: 006-conta-e-sync-supabase

**Feature**: `006-conta-e-sync-supabase`  
**Date**: 2026-10-16  
**Status**: Ready for Implementation  

Este guia descreve os cenários executáveis para validação de ponta a ponta da autenticação sem senha (OTP) e da sincronização bidirecional com o Supabase.

---

## 1. Pré-Requisitos

1. **Variáveis de Ambiente**:
   Configurar no `.env` (ou `.env.local`):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
   ```
   *Nota: Jamais utilizar a chave `service_role` no aplicativo móvel.*

2. **Schema Remoto Aplicado**:
   Executar o script SQL de migração em seu projeto Supabase:
   [schema.sql](contracts/schema.sql)

3. **Verificação de Ambiente**:
   ```bash
   npx tsc --noEmit
   npm test
   npx eslint .
   ```

---

## 2. Cenários de Validação Ponta a Ponta

### Cenário 1: "Acesso Imediato no Curral" (Operação Autônoma Sem Login)
- **Objetivo**: Garantir que o app inicia e permite o cadastro de animais e manejos sem tela de login obrigatória.
- **Passos**:
  1. Instalar o app limpo ou rodar no simulador/aparelho.
  2. Ativar o modo avião no dispositivo (ou simular offline via cabeçalho do app).
  3. Navegar até a aba **Reprodução** e cadastrar um novo animal (`brinco: "TESTE-01"`).
  4. Lançar uma inseminação rápida para o animal cadastrado.
- **Resultado Esperado**:
  - Registro salvo instantaneamente no SQLite local.
  - Indicador de status no topo exibe "Modo Offline" ou badge "1 Pendente".
  - O aplicativo não fecha nem exibe alertas modais bloqueantes.

---

### Cenário 2: Login por E-mail OTP e Vinculação da Fazenda
- **Objetivo**: Validar a entrada por código de 6 dígitos e a persistência em armazenamento seguro (`expo-secure-store`).
- **Passos**:
  1. Conectar o dispositivo à internet.
  2. Navegar até a aba **Ajustes** e tocar em "Entrar com Conta (E-mail OTP)".
  3. Digitar um endereço de e-mail válido e solicitar o código.
  4. Abrir a caixa postal, localizar o e-mail de autenticação e copiar o código de 6 dígitos.
  5. Inserir o código de 6 dígitos na tela do aplicativo.
- **Resultado Esperado**:
  - O código é validado pelo Supabase Auth.
  - A sessão segura é gravada no Keychain/Keystore do aparelho.
  - O card de status na aba Ajustes passa a exibir "Conectado" com o e-mail do usuário.
  - O `local_farm_id` é registrado como a fazenda do usuário na nuvem via `sync_bootstrap_farm`.

---

### Cenário 3: Drenagem Automática da Outbox (Push de Mutações Offline)
- **Objetivo**: Comprovar que dados criados offline sobem para a nuvem sem perdas após o login.
- **Passos**:
  1. Após o login no Cenário 2, observar o indicador no cabeçalho.
  2. O `PushEngine` processa automaticamente o lote de mutações locais pendentes geradas no Cenário 1.
  3. Consultar a tabela `animals` no painel do Supabase.
- **Resultado Esperado**:
  - O animal `TESTE-01` e a inseminação aparecem na tabela remota do Supabase com o mesmo `farm_id` e `id` (UUID).
  - A outbox local tem seu status atualizado para concluído (`processedOperationIds`).
  - O indicador visual no cabeçalho muda para verde "Sincronizado".

---

### Cenário 4: Sincronização Concorrente e Detecção de Brinco Duplicado
- **Objetivo**: Provar a resolução Last-Write-Wins (LWW) e a sinalização de brincos conflitantes.
- **Passos**:
  1. Em um segundo aparelho (ou sessão emulador), logar com a mesma conta.
  2. No aparelho B (desconectado), cadastrar uma bezerra com o brinco `"TESTE-01"`.
  3. Reconectar o aparelho B à internet e disparar sincronização.
- **Resultado Esperado**:
  - Ambos os animais com brinco `"TESTE-01"` permanecem cadastrados no SQLite local.
  - A entidade do animal recebe a marcação de conflito de brinco.
  - O cartão do animal exibe a etiqueta "Conflito de Brinco", permitindo que o operador altere a numeração sem perda de histórico.

---

### Cenário 5: Restauração Completa em Aparelho Novo (Initial Pull)
- **Objetivo**: Validar a carga inicial com tela de progresso em um aparelho sem dados prévios.
- **Passos**:
  1. Instalar o aplicativo em um dispositivo limpo.
  2. Na aba Ajustes, realizar login com a conta existente.
  3. Acompanhar a tela de restauração inicial com contadores de entidades transferidas.
- **Resultado Esperado**:
  - O download de animais, touros, coberturas e parâmetros é concluído em < 15 segundos.
  - O usuário é redirecionado para o painel principal com 100% dos dados acessíveis em modo offline.

---

## 3. Comandos de Teste Automatizado

Para rodar a suíte de testes de contratos e sincronização:
```bash
# Executar testes unitários do motor de sync e gateways
npm test src/core/sync

# Executar testes de integração da feature account / auth
npm test src/features/account
```
