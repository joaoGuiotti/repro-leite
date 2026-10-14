# Research & Architecture Decisions: 003-hoje-no-curral

**Feature**: Hoje no Curral (Painel Diário de Decisões, Monitoramento de Cios, Toques Veterinários e Trato de Bezerras)  
**Date**: 2026-10-14  
**Status**: Completed (Phase 0)

---

## 1. Janela Zootécnica de Observação e Consulta de Alertas

### Contexto
Vacas inseminadas têm o retorno do cio centrado em 21 dias (faixa biológica de 18 a 24 dias) e o exame de toque veterinário agendado para 45 dias (janela de palpação/ultrassom de 45 a 60 dias). Além disso, na rotina da fazenda, manejos que venceram em dias anteriores e não foram baixados precisam continuar visíveis como "atrasados".

### Decisão
Criar queries especializadas no repositório de alertas (ou use case de listagem) que filtram alertas pendentes (`completed_at IS NULL AND deleted_at IS NULL`) segundo os critérios:
1. **Cios para Vigiar (21d)**:
   - Tipo: `heat_check_21d`.
   - Condição de Data: `due_date <= advanceDays(activeDate, +3)` (cobre atrasados + janela até 24 dias da IA quando centrado em 21).
   - Enriquecimento: Junção com a fêmea (`animals`) para obter `earTag`, `name` e com a inseminação de origem (`inseminations`) para obter nome do touro e data da IA.
2. **Toques Veterinários (45d)**:
   - Tipo: `pregnancy_check_45d`.
   - Condição de Data: `due_date <= advanceDays(activeDate, +15)` (cobre atrasados + janela de 45 a 60 dias pós-IA).
   - Enriquecimento: Junção com `animals` e `inseminations`.

### Alternativas Consideradas
- *Filtrar apenas pela data exata de hoje (`due_date == activeDate`)*: Rejeitada pois desconsideraria vacas que entraram no cio no 19º ou 20º dia e deixaria invisíveis tarefas atrasadas de dias anteriores.
- *Carregar todos os alertas da fazenda e filtrar em JavaScript na UI*: Rejeitada por violar a regra de performance offline do SQLite em rebanhos com centenas de animais.

---

## 2. Fluxo da Ação "Repetiu o Cio" e Ações em 1 Toque

### Contexto
Quando uma vaca apresenta estro no 21º dia pós-IA, a tentativa anterior falhou. O vaqueiro pode querer cobrir o animal na mesma hora com outra dose ou apenas registrar a falha para programar o protocolo reprodutivo posterior.

### Decisão
Implementar o componente `RepeatHeatModal`:
- Ao acionar "Repetiu o Cio", exibe um modal tátil rápido (`ModalPadrao`) com duas opções:
  1. **"Re-inseminar Agora"**:
     - Executa o use case: marca a inseminação anterior como `result = 'vazia'`, conclui o alerta de cio de 21d com timestamp UTC e cria a operação na outbox.
     - Navega imediatamente via Expo Router para a tela de Inseminação Rápida (`/(tabs)/reproducao?action=inseminate&animalId=${animalId}`), abrindo o formulário já com a fêmea selecionada.
  2. **"Apenas Registrar Cio / Vazia"**:
     - Executa o use case em transação atômica: marca a inseminação anterior como `result = 'vazia'`, atualiza o status do animal para `reproStatus = 'vazia'`, conclui o alerta de cio e enfileira as mutações na outbox.
     - Remove o animal da lista de pendências com feedback háptico (`hapticFeedback.success()`).

Para a ação **"Não Repetiu"**:
- Executa em 1 toque direto: conclui o alerta de cio (`alertRepository.complete(alertId)`), mantém a vaca como `inseminada` e preserva o alerta de 45 dias para a visita do veterinário.

---

## 3. Fluxo de Confirmação e Diagnóstico de Toque Veterinário

### Contexto
No exame de toque aos 45-60 dias, o médico veterinário informa imediatamente se a vaca está "prenhe" ou "vazia".

### Decisão
Implementar o use case `RecordPregnancyTouchUseCase` que executa dentro de transação atômica (`withTransaction`):
1. **Se Confirmar Prenhez (`prenhe`)**:
   - `animals.repro_status` atualizado para `'prenhe'`.
   - `inseminations.result` atualizado para `'prenhe'`.
   - Alerta `pregnancy_check_45d` marcado com `completed_at = now()`.
   - Mantém confirmados os alertas futuros gerados no momento da IA (`dry_off` e `calving_due`).
   - Enfileira operações na outbox (`sync_queue`).
2. **Se Vazia (`vazia`)**:
   - `animals.repro_status` atualizado para `'vazia'`.
   - `inseminations.result` atualizado para `'vazia'`.
   - Alerta `pregnancy_check_45d` marcado como concluído.
   - Alertas futuros daquela inseminação (`dry_off`, `calving_due`) são cancelados/soft-deleted (`softDeleteBySourceId(inseminationId)`).
   - Enfileira operações na outbox.

---

## 4. Agregação Nutricional do Bezerreiro e Desmame Gradual

### Contexto
O tratador precisa do volume total de leite em litros a preparar pela manhã e à tarde. O cálculo deve ser derivado deterministicamente pela soma das idades das bezerras ativas em relação à data de manejo ativa.

### Decisão
Implementar a função de domínio pura `calculateDailyFeedingSummary`:
- Entrada: Lista de bezerras ativas (`sex = 'femea'`, `lifeStage in ('lactante', 'desmamada', 'recria')` ou idade < 180 dias) e data de referência `activeDate` (`YYYY-MM-DD`).
- Processamento:
  - Para cada bezerra, calcula `ageInDays = differenceInDays(activeDate, birthDate)`.
  - Executa `calculateFeedingPlan(ageInDays)` da entidade `calves`.
  - Soma `totalMorningLiters` e `totalAfternoonLiters`.
  - Filtra as bezerras em fase de corte (`stage === 'desmame'`) ou cuja transição ocorrerá nos próximos 7 dias (`ageInDays in [101..121]` ou `ageInDays in [9]..[15]`).
- Saída: `CalfFeedingSummary` estruturado.

Na UI:
- Componente `CalfFeedingCard`:
  - Cabeçalho exibindo `Litros da Manhã`, `Litros da Tarde` e total de bezerras ativas.
  - Botão de expansão (seta/gaveta) revelando a lista compacta de bezerras em transição de corte com indicação de dias de vida e litros por trato.

---

## 5. Arquitetura Feature-First e Regra de Composição

### Contexto
Conforme a regra de dependência do projeto (`.agents/rules/project-architecture.md`, Seção 3):
"Composição entre features acontece em `features/today/` ou na rota, nunca dentro de outra feature. `features/A -> features/B`: só `features/B/index.ts`."

### Decisão
`src/features/today/` será a camada de orquestração do painel diário:
- Consome ports/use cases de `@features/alerts`, `@features/herd`, `@features/insemination` e `@features/calves` exclusivamente através de seus respectivos `index.ts`.
- Expõe use cases próprios em `src/features/today/application/` orquestrando as decisões diárias.
- Centraliza os hooks em `src/features/today/presentation/hooks/` (`useTodayDashboard`, `useTodayActions`).
- Toda escrita utiliza transação atômica do SQLite (`withTransaction`) e enfileiramento na outbox (`outbox.enqueue`).
- Telas e componentes utilizam exclusivamente o Design System em `@ui` (`src/ui`).
