# Quickstart & Validation Guide: 003-hoje-no-curral

**Feature**: Hoje no Curral (Painel Diário de Decisões, Monitoramento de Cios, Toques Veterinários e Trato de Bezerras)  
**Date**: 2026-10-14  
**Status**: Completed (Phase 1)

---

## 1. Pré-Requisitos e Ambiente

1. Ambiente de desenvolvimento configurado (Node.js 20+, Expo SDK 57, SQLite local).
2. Simulador ou dispositivo móvel executando o aplicativo (`npm start` ou `npx expo start`).
3. Banco de dados local inicializado com sementes de teste ou animais previamente cadastrados (Features 000, 001, 002).

---

## 2. Cenários de Validação Ponta a Ponta

### Cenário 1: Quadro de Cios para Vigiar (Janela de 21 dias)

**Objetivo**: Validar a tomada de decisão em 1 toque para fêmeas com retorno de cio previsto.

1. **Preparação**:
   - Inseminar a vaca brinco `101` com data D-21 (21 dias atrás em relação à data ativa do simulador).
   - Abrir a aba **"Hoje"** no aplicativo.
2. **Execução do Teste**:
   - Observar se o cartão da vaca `101` é exibido no quadro **"Cios para Vigiar (21d)"**.
   - Tocar em **"Não Repetiu"**:
     - *Resultado Esperado*: Feedback háptico de sucesso; o alerta é concluído e o cartão desaparece do quadro. O status da vaca permanece `Inseminada`.
3. **Fluxo de Repetição de Cio**:
   - Em uma segunda vaca (`102` com IA há 21 dias), tocar em **"Repetiu o Cio"**:
     - *Resultado Esperado*: O modal `RepeatHeatModal` é exibido com as opções *"Re-inseminar Agora"* e *"Apenas Marcar Cio / Vazia"*.
   - Ao escolher *"Apenas Marcar Cio / Vazia"*: o status da vaca passa para `Vazia` e o alerta é concluído.
   - Ao escolher *"Re-inseminar Agora"*: a tentativa anterior é arquivada como vazia e a tela redireciona para a aba Inseminar com a vaca `102` pré-carregada.

---

### Cenário 2: Diagnóstico de Toque Veterinário (45 a 60 dias)

**Objetivo**: Validar a confirmação de prenhez e a baixa por vazio no curral.

1. **Preparação**:
   - Inseminar a vaca brinco `201` com data D-45 (45 dias atrás).
   - Inseminar a vaca brinco `202` com data D-45.
   - Abrir a aba **"Hoje"**.
2. **Execução do Teste (Confirmar Prenhez)**:
   - No cartão da vaca `201` no quadro **"Toques Veterinários (45d)"**, tocar em **"Confirmar Prenhez"**:
     - *Resultado Esperado*: Status da vaca no rebanho atualizado para `Prenhe`; resultado da inseminação atualizado para `prenhe`; alertas de Secagem e Parto confirmados; cartão removido do painel diário.
3. **Execução do Teste (Confirmar Vazia)**:
   - No cartão da vaca `202`, tocar em **"Vazia"**:
     - *Resultado Esperado*: Status da vaca atualizado para `Vazia`; resultado da IA atualizado para `vazia`; alertas subsequentes de parto e secagem daquela IA são cancelados; vaca disponível para nova IA.

---

### Cenário 3: Quadro do Bezerreiro e Leite Diário

**Objetivo**: Validar a soma exata de litros de leite e a expansão das bezerras em corte.

1. **Preparação**:
   - Cadastrar bezerra `B1` com 10 dias de vida (Fase Inicial: 2L manhã + 2L tarde = 4L).
   - Cadastrar bezerra `B2` with 30 dias de vida (Pico: 4L manhã + 4L tarde = 8L).
   - Cadastrar bezerra `B3` with 105 dias de vida (Desmame Gradual: 2L manhã + 2L tarde = 4L).
2. **Execução do Teste**:
   - No quadro **"Trato do Bezerreiro"**, verificar o indicador consolidado:
     - *Manhã*: `8 L` (2 + 4 + 2).
     - *Tarde*: `8 L` (2 + 4 + 2).
     - *Total*: `16 L/dia`.
   - Tocar na área de expansão do cartão:
     - *Resultado Esperado*: A gaveta expande exibindo a bezerra `B3` em fase de desmame gradual, com idade de 105 dias e indicação do próximo corte.

---

### Cenário 4: Resiliência Offline-First

**Objetivo**: Garantir continuidade operacional completa sem rede celular ou Wi-Fi.

1. Ativar o **Modo Avião** no dispositivo ou desconectar a rede.
2. Realizar a confirmação de 1 toque de um cio e o diagnóstico de um toque veterinário.
3. *Resultado Esperado*: Resposta instantânea da interface (< 100ms), atualização no SQLite e registro correspondente na fila `sync_queue` com o badge discreto `PendingSyncBadge`.

---

## 3. Comandos de Verificação Automática

Antes de concluir qualquer ciclo de implementação:

```bash
# 1. Typecheck estrito
npx tsc --noEmit

# 2. Testes unitários do domínio e use cases
npm test

# 3. Linter do projeto
npx eslint .
```
