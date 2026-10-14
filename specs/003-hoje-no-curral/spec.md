# Feature Specification: 003-hoje-no-curral

**Feature Branch**: `003-hoje-no-curral`

**Created**: 2026-10-14

**Status**: Ready for Planning

**Input**: User description: "/speckit-specify 003-hoje-no-curral"

## Clarifications

### Session 2026-10-14

- **Q1 (Janela de visualização dos Cios e Toques)**: Qual critério de datas deve ser exibido nos quadros de Cios para Vigiar e Toques Veterinários?  
  **A1**: Janela zootécnica de observação: tarefas atrasadas pendentes + janela ativa (18 a 24 dias pós-IA para cios e 45 a 60 dias para toques).

- **Q2 (Fluxo operacional da ação 'Repetiu o Cio')**: O que deve acontecer ao tocar em "Repetiu o Cio" no cartão de uma vaca aos 21 dias?  
  **A2**: Modal de decisão rápida: oferece duas opções ("Re-inseminar agora" com a vaca pré-carregada na tela de IA, ou "Apenas registrar cio / Vazia" para cobrir mais tarde). Ambas encerram a IA anterior como vazia.

- **Q3 (Detalhamento do Quadro do Bezerreiro)**: Como apresentar a relação de bezerras em transição ou corte gradual de leite na tela de Hoje?  
  **A3**: Card expansível no próprio painel: exibe o total de litros (manhã/tarde) no topo e permite expandir uma lista das bezerras em semana de corte ou mudança de fase.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quadro de Cios para Vigiar (Janela de 21 dias) com Decisão em 1 Toque (Priority: P1)

Como vaqueiro ou inseminador na lida matinal do curral, quero visualizar imediatamente quais vacas atingiram o prazo de retorno de cio (janela zootécnica de 18 a 24 dias pós-IA mais atrasadas pendentes) e tomar uma ação imediata em 1 toque ("Repetiu o Cio" ou "Não Repetiu"), para que eu possa apartar a vaca para nova inseminação ou confirmar que ela segurou provisoriamente o cio sem burocracia nem anotações em papel.

**Why this priority**: A observação de cio aos 21 dias é o ponto de maior retorno econômico na reprodução leiteira. Detectar um cio repetido no dia certo economiza 21 dias de intervalo entre partos e custos de alimentação com vacas improdutivas.

**Independent Test**: Pode ser testado registrando uma vaca com inseminação há 21 dias. Ao abrir o painel "Hoje no Curral", o cartão da vaca deve aparecer no quadro "Cios para Vigiar". Ao tocar em "Não Repetiu", o alerta é concluído e o animal aguarda o toque aos 45 dias; ao tocar em "Repetiu", o sistema abre o modal de decisão rápida permitindo re-inseminar na hora ou registrar cio/vazia para cobertura posterior.

**Acceptance Scenarios**:

1. **Given** que existem vacas com alertas de cio ativos na janela zootécnica (18 a 24 dias pós-IA ou atrasadas não concluídas), **When** o usuário acessa a aba "Hoje no Curral", **Then** o sistema exibe os cartões dessas fêmeas com brinco em destaque, nome do animal, touro da última IA e botões de ação tátil rápida (altura >= 48px).
2. **Given** uma vaca no quadro de Cios para Vigiar, **When** o usuário toca no botão "Não Repetiu", **Then** o sistema registra a conclusão do alerta de 21 dias, mantém a vaca com status reprodutivo "Inseminada", mantém o agendamento do exame de toque para os 45 dias pós-IA e remove o cartão do quadro de pendências do dia com feedback háptico de sucesso.
3. **Given** uma vaca no quadro de Cios para Vigiar que apresentou sintomas de estro, **When** o usuário toca em "Repetiu o Cio", **Then** o sistema abre um modal de decisão rápida apresentando:
   - Opção 1: "Re-inseminar Agora" — encerra a IA anterior como `vazia`, conclui o alerta de cio e navega imediatamente para a tela de Inseminação Rápida com a vaca já pré-selecionada.
   - Opção 2: "Apenas Marcar Cio / Vazia" — encerra a IA anterior como `vazia`, altera o status do animal para `vazia`, conclui o alerta de cio e mantém a vaca apta para cobertura futura.

---

### User Story 2 - Quadro de Toques Veterinários (45 a 60 dias) e Diagnóstico de Gestação (Priority: P1)

Como médico veterinário ou produtor na lida com o tronco de contenção, quero ver a lista de vacas aguardando exame de toque/ultrassom (janela de 45 a 60 dias pós-IA mais atrasadas pendentes) e lançar o diagnóstico em 1 toque ("Confirmar Prenhez" ou "Vazia"), para que o status reprodutivo de todo o lote seja atualizado instantaneamente durante a passagem dos animais pelo curral.

**Why this priority**: O diagnóstico de gestação determina o destino zootécnico e nutricional da vaca. A confirmação rápida no tronco elimina erros de identificação e atualiza automaticamente os prazos de secagem e parto.

**Independent Test**: Pode ser testado gerando uma IA há 45 dias. Ao abrir o painel "Hoje no Curral", o animal deve figurar no quadro "Toques Veterinários". Ao selecionar "Confirmar Prenhez", o status do animal deve virar "Prenhe" e a inseminação correspondente ter o resultado atualizado para "prenhe". Ao selecionar "Vazia", o status do animal vira "Vazia" e os alertas subsequentes de parto e secagem daquela IA são cancelados.

**Acceptance Scenarios**:

1. **Given** que o rebanho possui fêmeas cuja data de toque veterinário está na janela ativa (45 a 60 dias pós-IA ou atrasadas pendentes), **When** o usuário visualiza o quadro de Toques Veterinários, **Then** as vacas são apresentadas ordenadas por brinco ou data com ações de diagnóstico em destaque.
2. **Given** uma vaca sob avaliação no tronco cujo diagnóstico foi positivo, **When** o operador toca em "Confirmar Prenhez", **Then** o sistema:
   - Altera o status reprodutivo do animal para `prenhe`.
   - Atualiza o resultado da inseminação para `prenhe`.
   - Conclui o alerta de toque veterinário (`pregnancy_check_45d`).
   - Mantém ativos e confirmados os marcos zootécnicos de secagem (-60d) e parto previsto (+282d).
3. **Given** uma vaca cujo diagnóstico foi negativo, **When** o operador toca em "Vazia", **Then** o sistema:
   - Altera o status reprodutivo do animal para `vazia`.
   - Atualiza o resultado da inseminação para `vazia`.
   - Conclui o alerta de toque veterinário.
   - Cancela/exclui os alertas futuros de secagem e parto associados àquela inseminação.
   - Deixa a vaca imediatamente apta e disponível na seleção de nova inseminação.

---

### User Story 3 - Quadro do Bezerreiro: Trato Diário de Leite e Previsão de Desmame (Priority: P2)

Como tratador de bezerras ou produtor de leite, quero visualizar o volume total de leite a preparar para o dia (Litros da Manhã e Litros da Tarde) e abrir uma gaveta/cartão expansível com a listagem de bezerras que estão em processo de corte gradual ou mudança de fase na semana, para que o preparo do leite seja exato, evitando desperdício de alimento ou subnutrição das bezerras.

**Why this priority**: O aleitamento correto é a base da taxa de sobrevivência e do ganho de peso das futuras novilhas. A totalização automática dos litros por período diário substitui cálculos manuais e garante que o tratador forneça a dosagem exata por bezerra.

**Independent Test**: Pode ser testado cadastrando bezerras em diferentes faixas etárias (ex.: uma bezerra de 10 dias recebendo 2L+2L, uma de 30 dias recebendo 4L+4L e uma desmamada de 130 dias recebendo 0L). O quadro do Bezerreiro deve somar automaticamente 6L no trato da manhã e 6L no trato da tarde, totalizando 12L/dia, e permitir expandir o cartão para inspecionar os detalhes individuais.

**Acceptance Scenarios**:

1. **Given** as bezerras ativas cadastradas na fazenda com suas respectivas idades calculadas a partir da data de manejo ativa, **When** o usuário visualiza o Quadro do Bezerreiro na tela "Hoje no Curral", **Then** o sistema calcula deterministicamente pela curva de aleitamento (`calculateFeedingPlan`):
   - **Litros da Manhã**: soma do volume matinal de todas as bezerras vivas.
   - **Litros da Tarde**: soma do volume vespertino de todas as bezerras vivas.
   - **Total Diário**: volume acumulado de leite.
2. **Given** bezerras que estão na fase de desmame gradual (101 a 121 dias) ou com mudança de etapa prevista para os próximos 7 dias, **When** o usuário toca no botão/seta de expansão do cartão do Bezerreiro, **Then** o componente expande uma lista integrada exibindo os brincos dos animais, os litros atuais por trato (manhã/tarde) e a data do próximo degrau de corte.
3. **Given** que não há bezerras em aleitamento ativo (todas desmamadas ou sem bezerras na base), **When** o quadro é renderizado, **Then** exibe "0 L Manhã · 0 L Tarde" com mensagem explicativa e estado neutro sem erros de renderização.

---

### User Story 4 - Painel Diário Executivo e Ações Rápidas de Curral (Priority: P2)

Como operador da fazenda, quero ver no topo da tela o resumo executivo das pendências do dia, a data de manejo ativa (real ou simulada) e atalhos de 1 toque para as ações mais frequentes do curral ("Nova Inseminação", "Cadastrar Animal", "Consultar Rebanho"), para que eu possa navegar e executar manejos rapidamente com uma única mão.

**Why this priority**: Concentra o ponto de partida do trabalho diário do operador rural, reduzindo toques e tempo de tela.

**Independent Test**: Pode ser testado alterando a data simulada no cabeçalho; o painel diário e seus contadores devem recalcular instantaneamente as pendências correspondentes à nova data.

**Acceptance Scenarios**:

1. **Given** a data ativa de manejo (seja a data do calendário do dispositivo ou a data definida no simulador), **When** o usuário abre a tela, **Then** o cabeçalho exibe a data formatada em `DD/MM/AAAA` com selo visual indicando se a data é real ou simulada.
2. **Given** os cartões de resumo diário no topo, **When** existem tarefas pendentes, **Then** os contadores vivos de Cios para Vigiar, Toques Veterinários e Trato de Leite refletem os valores calculados em tempo real.
3. **Given** a barra de ações rápidas, **When** o usuário toca em "Nova Inseminação", **Then** o sistema abre imediatamente o formulário de IA rápida (Feature 002); ao tocar em "Cadastrar Animal", abre o cadastro do rebanho; ao tocar em "Consultar Rebanho", navega para a lista de animais.

---

### User Story 5 - Resiliência e Operação Offline-First em Campo (Priority: P2)

Como vaqueiro operando no curral ou retiro onde não há sinal de internet nem Wi-Fi, quero que todas as consultas, confirmações de prenhez, registros de repetição de cio e baixas de tarefas ocorram instantaneamente no banco de dados SQLite local, enfileirando mutações para sincronização futura em segundo plano, para que nenhum manejo deixe de ser registrado por falta de conexão.

**Why this priority**: Princípio Constitucional I (Offline-First). O aplicativo não pode apresentar travamento, latência ou dependência de rede em nenhuma ação no curral.

**Independent Test**: Pode ser testado ativando o modo avião no dispositivo, confirmando a prenhez de 2 vacas e concluindo um alerta de cio; a interface deve responder em menos de 100ms, persistir no SQLite e registrar operações na fila de outbox.

**Acceptance Scenarios**:

1. **Given** o dispositivo sem nenhuma conectividade com a internet, **When** o usuário realiza qualquer ação de 1 toque no painel "Hoje no Curral", **Then** a mutação é executada localmente no SQLite dentro de uma transação atômica (`withTransaction`) registrando o dado e a operação de outbox correspondente.
2. **Given** registros pendentes de envio na outbox, **When** os cartões são exibidos na tela, **Then** eles exibem o indicador discreto `PendingSyncBadge` sem bloquear a edição.

---

### Edge Cases

- **Vaca já confirmada prenhe que apresenta cio**: Se o usuário registrar repetição de cio em uma vaca cujo status já era "Prenhe", o sistema deve alertar o operador sobre a perda gestacional (aborto precoce/reabsorção) e solicitar confirmação antes de alterar o status para vazia/inseminada.
- **Vaca sem histórico de IA com alerta avulso**: O sistema deve lidar com integridade caso um alerta exista sem vínculo direto com inseminação cadastrada, permitindo a conclusão normal da tarefa.
- **Nenhuma bezerra cadastrada na fazenda**: O Quadro do Bezerreiro deve renderizar com segurança exibindo 0 litros sem erros aritméticos de divisão por zero.
- **Retrocesso de data de manejo no simulador**: Caso o usuário volte no tempo pelo simulador para uma data anterior à inseminação, tarefas futuras daquela IA não devem figurar como pendentes nem quebrar o estado da tela.
- **Múltiplos alertas para o mesmo animal no mesmo dia**: O sistema deve agrupar ou exibir separadamente de forma clara para que o usuário não conclua um manejo diferente por engano.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir no quadro "Cios para Vigiar" todas as fêmeas com alerta de retorno de cio (`heat_check_21d`) pendentes na janela zootécnica de 18 a 24 dias pós-IA, bem como alertas com data de vencimento anterior à data de manejo ativa ainda não concluídos (atrasados).
- **FR-002**: O sistema DEVE disponibilizar ação de 1 toque "Não Repetiu" no cartão de cio, marcando o alerta de 21 dias como concluído, mantendo o status do animal como `inseminada` e preservando o agendamento de toque aos 45 dias.
- **FR-003**: O sistema DEVE disponibilizar ação de 1 toque "Repetiu o Cio", abrindo um modal de decisão rápida que permite ao operador optar entre:
  - (a) "Re-inseminar Agora" (marca a IA anterior como `vazia`, conclui o alerta de 21 dias e abre o fluxo de IA com o animal pré-carregado);
  - (b) "Apenas Registrar Cio / Vazia" (marca a IA anterior como `vazia`, atualiza o status do animal para `vazia` e conclui o alerta de 21 dias).
- **FR-004**: O sistema DEVE listar no quadro "Toques Veterinários" todas as fêmeas com exame de diagnóstico de gestação (`pregnancy_check_45d`) pendentes na janela de 45 a 60 dias pós-IA ou com vencimento atrasado.
- **FR-005**: O sistema DEVE permitir a confirmação de diagnóstico positivo ("Confirmar Prenhez") em 1 toque, atualizando atomicamente o status do animal para `prenhe`, o resultado da IA para `prenhe`, concluindo o alerta de toque e confirmando as previsões de secagem e parto.
- **FR-006**: O sistema DEVE permitir a confirmação de diagnóstico negativo ("Vazia") em 1 toque, atualizando o status do animal para `vazia`, o resultado da IA para `vazia`, concluindo o alerta de toque e cancelando os alertas subsequentes de secagem e parto daquela IA.
- **FR-007**: O sistema DEVE calcular o volume diário de leite para o bezerreiro somando deterministicamente as doses individuais de manhã e tarde de todas as bezerras ativas da fazenda conforme a curva etária oficial:
  - 0 a 15 dias: 2L manhã + 2L tarde (4 L/dia).
  - 16 a 100 dias: 4L manhã + 4L tarde (8 L/dia).
  - 101 a 121 dias: 2L manhã + 2L tarde ou corte progressivo (4 L/dia).
  - 122+ dias: 0 L (desmamadas).
- **FR-008**: O sistema DEVE implementar o cartão do bezerreiro como um componente expansível, exibindo no cabeçalho o volume total consolidado (Manhã e Tarde) e, ao expandir, a lista das bezerras em corte ou mudança de fase semanal.
- **FR-009**: O sistema DEVE utilizar a data de manejo ativa fornecida pelo contexto central de simulação (`useManagementDate`), recalculando reativamente todas as pendências ao avançar ou retroceder a data.
- **FR-010**: O sistema DEVE persistir todas as mutações no SQLite local em transação com a fila de sincronização (`outbox`), gerando UUIDs v7 e registrando timestamps em UTC.
- **FR-011**: Todos os elementos interativos de decisão no curral DEVEM possuir área de toque mínima de 48x48 dp (ou 56 dp para botões primários) e contraste legível sob luz solar direta.
- **FR-012**: O sistema DEVE utilizar exclusivamente os componentes padronizados do Design System em `src/ui/` (`Screen`, `Cartao`, `Botao`, `SeloStatus`, `Icon`, `EmptyState`, `Skeleton`, `ModalPadrao`).

---

### Key Entities *(include if feature involves data)*

- **Alert (`alerts`)**: Representa a tarefa ou marco zootécnico agendado para um animal. Possui `id`, `farmId`, `targetAnimalId`, `type` (`heat_check_21d`, `pregnancy_check_45d`, `calving_due`, `dry_off`), `dueDate`, `completedAt`, `sourceId` (ID da IA de origem), `notes`.
- **Insemination (`inseminations`)**: Registro do procedimento reprodutivo. Possui `id`, `farmId`, `animalId`, `bullId`, `bullName`, `date`, `inseminator`, marcos previstos (`expectedHeatDate`, `pregnancyCheckDate`, `expectedCalvingDate`, `dryOffDate`) e `result` (`pendente`, `prenhe`, `vazia`).
- **Animal (`animals`)**: Cadastro do bovino no rebanho. Possui `id`, `farmId`, `earTag`, `name`, `sex`, `birthDate`, `lifeStage`, `reproStatus` (`vazia`, `inseminada`, `prenhe`, `seca`), `exitStatus`.
- **CalfFeedingSummary (Derivado em Memória/Domínio)**: Agregação diária das bezerras em aleitamento contendo `totalMorningLiters`, `totalAfternoonLiters`, `totalDailyLiters`, `activeCalvesCount` e lista de animais em corte/transição.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O operador no curral consegue registrar o diagnóstico de toque (prenhe ou vazia) de uma vaca em menos de 5 segundos e no máximo 2 toques na tela.
- **SC-002**: A resolução de um aviso de cio aos 21 dias ("Não Repetiu" ou "Repetiu o Cio") é executada em até 3 segundos com feedback tátil/visual imediato.
- **SC-003**: O cálculo de litros de leite do bezerreiro (manhã e tarde) e a atualização dos contadores diários carregam em menos de 300 milissegundos a partir do SQLite local em bases com até 500 animais.
- **SC-004**: 100% das operações de confirmação e conclusão de alertas são persistidas localmente sem depender de conexão com internet, gerando mutação na outbox em transação única.
- **SC-005**: 100% dos controles interativos e botões de decisão possuem alvos táteis de no mínimo 48 dp (ou 56 dp para botões primários) em conformidade com as diretrizes de ergonomia rural.

---

## Assumptions

- A fazenda possui animais cadastrados no rebanho (fêmeas e bezerras) e inseminações registradas gerando alertas zootécnicos.
- O modelo de datas biológicas segue o padrão zootécnico estabelecido: retorno de cio em 21 dias, toque em 45 dias, gestação de 282 dias e secagem aos 222 dias (parto menos 60 dias).
- A curva nutricional do bezerreiro baseia-se na idade cronológica da bezerra em relação à data ativa de manejo do sistema.
- A persistência é realizada em SQLite local via Drizzle ORM, compatível com sincronização posterior via Supabase.
- A linguagem da interface é estritamente português do Brasil (`pt-BR`).
