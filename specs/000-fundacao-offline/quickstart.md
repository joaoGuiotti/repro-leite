# Quickstart & Guia de Validação: Fundação Offline

**Feature**: `000-fundacao-offline`  
**Data**: 2026-10-13  
**Status**: Ready

Este guia descreve os cenários de validação prática para comprovar que a fundação do aplicativo, o banco local, a ergonomia visual e o cabeçalho com simulador e sincronização estão funcionando de ponta a ponta.

---

## 1. Pré-Requisitos e Ambiente

1. Dependências do projeto instaladas (`npm install`).
2. Dispositivo físico Android conectado via depuração USB ou emulador Android/iOS ativo.
3. Servidor de desenvolvimento iniciado:
   ```bash
   npx expo start
   ```

---

## 2. Cenários de Validação Prática

### Cenário 1: Persistência 100% Offline (Modo Curral)
1. Coloque o dispositivo ou emulador em **Modo Avião** (desative Wi-Fi e dados móveis).
2. Abra o aplicativo ReproLeite.
3. **Resultado Esperado**:
   - O aplicativo carrega instantaneamente sem exibir telas brancas ou avisos de "sem conexão".
   - A fazenda inicial padrão é inicializada no SQLite local sem erros.
   - O cabeçalho no topo exibe a data atual de hoje e o selo 🟢 Nuvem Protegida (com 0 alterações pendentes).

---

### Cenário 2: Simulador Temporal de Manejo (+1d, +7d, +21d)
1. Com o app aberto, observe a data no cabeçalho.
2. Toque no botão de atalho **`+1d`**.
   - **Resultado Esperado**: A data avança 1 dia no cabeçalho imediatamente (< 100ms) e o badge indica modo simulado.
3. Toque no botão de atalho **`+7d`**.
   - **Resultado Esperado**: A data avança mais 7 dias.
4. Toque no botão **`+21d (Cio)`**.
   - **Resultado Esperado**: A data avança 21 dias (uma janela completa de retorno de cio).
5. Toque no botão **`Resetar para Hoje`**.
   - **Resultado Esperado**: A data retorna instantaneamente para a data real do dia e o badge remove a indicação de simulação.

---

### Cenário 3: Rastreamento de Pendências na Fila de Sync
1. No cabeçalho, ative o switch **"Simular: Sem Internet"**.
2. Realize uma operação de salvamento de configuração ou registro teste.
3. **Resultado Esperado**:
   - O selo no cabeçalho transiciona imediatamente de verde para 🟡 **1 alteração pendente de envio (Modo Curral Offline)**.
   - A alteração fica guardada na tabela local `sync_queue`.
4. Desative o switch "Sem Internet" e toque em **"Sincronizar Agora"**.
   - **Resultado Esperado**:
     - O selo transiciona para 🔵 **Sincronizando com Supabase...**.
     - Ao concluir com sucesso, retorna para 🟢 **Nuvem Protegida · Sincronizado agora**.

---

### Cenário 4: Ergonomia Visual e Alto Contraste Sob Luz Solar
1. Inspecione os componentes base renderizados em `src/ui/`:
   - Botões primários (`Botao`): confirme que a altura física de toque atinge no mínimo 56px (`min-h-14`).
   - Controles secundários e campos: confirme que a altura atinge no mínimo 48px (`min-h-12`).
2. Verifique os contrastes de cor:
   - Texto escuro (`#0f172a`) sobre fundo claro (`#ffffff` / `#f8fafc`).
   - Verde pasto de alta visibilidade (`#1b4332`).
   - Nenhuma dependência de tema escuro.
