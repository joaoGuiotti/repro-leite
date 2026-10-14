# Feature Specification: 004-bezerras-aleitamento-recria

**Feature Branch**: `feature/004-bezerras-aleitamento-recria`  
**Created**: 2026-10-14  
**Status**: Ready for Planning  
**Input**: User description: "/speckit-specify 004-bezerras-aleitamento-recria. Aba Bezerras (Genealogia em 3 Níveis, Curva de Leite & Recria). Requisitos: Cadastro de Bezerra com genealogia em 3 níveis (Bezerra -> Mãe -> Pai -> Avó Materna), Calculadora Automática de Aleitamento (0-15d 4L, 16-100d 8L, 101-107d 4L, 108-114d 2L, 115-121d 1L, 122+d 0L desmamada), Linha do Tempo de Desmame com datas exatas, Acompanhamento de Recria & GMD com pesagens mensais, régua até a meta de 360 kg para 1ª IA e atalho Apta para IA."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastro de Bezerra com Genealogia em 3 Níveis Visuais (Priority: P1) 🎯 MVP Core

Como tratador de bezerras ou produtor de leite,  
Quero cadastrar uma bezerra recém-nascida informando brinco, sexo, data de nascimento, peso inicial e sua ascendência genealógica (mãe, pai e avó materna),  
Para que o animal entre imediatamente no controle zootécnico e nutricional com rastreabilidade genética completa.

**Why this priority**: É a porta de entrada indispensável para toda a vida produtiva do animal na fazenda leiteira. Sem o nascimento e a identificação genealógica, não há acompanhamento de aleitamento nem planejamento genético de acasalamentos futuros.

**Independent Test**: Cadastrar uma nova bezerra com brinco "B-105", sexo fêmea, data de hoje, peso de 42 kg, vinculando a mãe selecionada do rebanho "Vaca Estrela", pai touro "Jaguar" selecionado do catálogo e avó materna digitada "Vaca Vitória"; o animal surge na listagem do bezerreiro com seu badge de brinco e árvore genealógica de 3 níveis perfeitamente renderizada.

**Acceptance Scenarios**:
1. **Given** que o usuário está na aba "Bezerras", **When** toca em "Cadastrar Nova Bezerra" e preenche os campos obrigatórios (brinco, data de nascimento, sexo), **Then** o sistema gera o registro com status inicial ativo e peso de nascimento (default 40,0 kg se não informado).
2. **Given** o formulário de cadastro de bezerra, **When** o usuário escolhe a mãe a partir da lista de vacas do rebanho da fazenda, **Then** o sistema pré-carrega automaticamente a Avó Materna caso a mãe selecionada já possua essa ascendência registrada.
3. **Given** o formulário de genealogia, **When** o usuário vincula o Pai, **Then** a seleção é feita a partir do catálogo de touros cadastrados (sêmen/reprodutores da fazenda).
4. **Given** o campo de Avó Materna, **When** o usuário precisa informar ou ajustar o nome da avó, **Then** o campo permite entrada de texto livre opcional.

---

### User Story 2 - Plano de Aleitamento & Linha do Tempo de Desmame (Priority: P1)

Como tratador do bezerreiro,  
Quero visualizar a fase exata de aleitamento, o volume diário recomendado (manhã e tarde) e o calendário previsto de degraus de desmame para cada bezerra,  
Para que eu forneça a nutrição líquida correta sem desperdício e realize a transição gradual para sólidos sem estresse gástrico.

**Why this priority**: A fase de aleitamento define a imunidade e o desenvolvimento das papilas ruminais da futura vaca leiteira. A transição abrupta causa diarreia e atraso no ganho de peso.

**Independent Test**: Consultar o detalhe de uma bezerra de 45 dias de vida; o sistema exibe status "Pico de Aleitamento" recomendando 4 L na manhã e 4 L na tarde (total 8 L/dia) e uma linha do tempo mostrando as datas de calendário exatas para início do corte aos 101 dias e desmame total aos 122 dias.

**Acceptance Scenarios**:
1. **Given** uma bezerra com 10 dias de vida, **When** o tratador abre seu prontuário, **Then** o sistema indica "Fase Inicial: 4 L/dia (2 L Manhã + 2 L Tarde)".
2. **Given** uma bezerra com 40 dias de vida, **When** consultada, **Then** o sistema indica "Fase de Pico: 8 L/dia (4 L Manhã + 4 L Tarde)".
3. **Given** uma bezerra entrando na semana de corte (101 a 107 dias), **When** consultada, **Then** o sistema indica "1ª semana de corte: 4 L/dia (2 L Manhã + 2 L Tarde)" e exibe aviso visual da transição.
4. **Given** uma bezerra com 122 dias ou mais, **When** consultada, **Then** o sistema indica "Desmamada: 0 L/dia" e exibe confirmação de desmame concluído.
5. **Given** a data ativa do sistema (real ou simulada), **When** a bezerra é avaliada, **Then** a linha do tempo calcula as datas civis exatas para cada mudança de degrau (101d, 108d, 115d e 122d).

---

### User Story 3 - Acompanhamento de Recria, Histórico de Pesagens e GMD (Priority: P2)

Como produtor de leite ou veterinário,  
Quero lançar pesagens periódicas para cada novilha e visualizar o Ganho Médio Diário (GMD em g/dia) entre pesagens consecutivas,  
Para monitorar a velocidade de crescimento e garantir que o lote de recria atinja o peso ideal para a reprodução precoce.

**Why this priority**: O custo da recria representa até 20% das despesas totais de uma fazenda leiteira. Acompanhar o GMD permite identificar precocemente animais refugos ou com atraso nutricional.

**Independent Test**: Cadastrar uma pesagem de 90 kg aos 60 dias de vida e uma nova pesagem de 120 kg aos 90 dias de vida; o sistema calcula e exibe automaticamente o GMD de 1.000 g/dia (1,00 kg/dia) no período e exibe o histórico ordenado por data.

**Acceptance Scenarios**:
1. **Given** uma bezerra/novilha cadastrada, **When** o usuário aciona "Lançar Pesagem" informando data e peso em kg, **Then** a pesagem é registrada no histórico cronológico do animal.
2. **Given** um animal com ao menos duas pesagens registradas, **When** o prontuário é exibido, **Then** o sistema calcula o GMD em g/dia: `((peso_atual - peso_anterior) / dias_decorridos) * 1000`.
3. **Given** uma nova pesagem registrada, **When** calculada em relação ao peso de nascimento (40,0 kg padrão ou valor real cadastrado), **Then** o sistema exibe também o GMD acumulado desde o nascimento.

---

### User Story 4 - Transição Automática de Fase, Régua de Progresso e Apta para 1ª IA (Priority: P2)

Como inseminador ou gerente do rebanho,  
Quero que o animal transite automaticamente para novilha aos 122 dias e que sua régua visual de peso aponte para a meta de ~360 kg, oferecendo atalho de 1 toque para inseminar ao bater a meta,  
Para antecipar a idade ao primeiro parto (meta aos 22-24 meses) sem perder o momento biológico ideal.

**Why this priority**: Conecta diretamente o trabalho do bezerreiro/recria com o ciclo reprodutivo principal do rebanho (`002-inseminacao-rapida` e `003-hoje-no-curral`).

**Independent Test**: Lançar pesagem de 365 kg para uma novilha de 14 meses; o sistema altera o indicador visual para verde "Apta para 1ª IA" e exibe o botão principal de 56px "Lançar 1ª Inseminação", que navega para a aba Reprodução pré-selecionando a novilha.

**Acceptance Scenarios**:
1. **Given** uma bezerra que atinge 122 dias de vida (desmame total), **When** o sistema avalia seu registro na data ativa, **Then** seu estágio de vida (`lifeStage`) transita automaticamente para `novilha` na fase de recria.
2. **Given** uma novilha com peso registrado inferior a 360 kg (ex.: 280 kg), **When** visualizada, **Then** a barra de progresso exibe a porcentagem atingida (ex.: 77% da meta de 360 kg) e a quantidade de kg faltantes (80 kg).
3. **Given** uma novilha que atinge ou supera 360 kg, **When** a pesagem é salva, **Then** o sistema exibe o selo de destaque "Apta para 1ª IA".
4. **Given** uma novilha apta, **When** o usuário toca no botão "Lançar 1ª Inseminação", **Then** o aplicativo navega diretamente para o formulário de inseminação com o brinco e ID da novilha já preenchidos via rota.

---

### User Story 5 - Listagem e Filtros Operacionais do Bezerreiro (com Suporte a Machos) (Priority: P3)

Como tratador ou gerente,  
Quero uma visão consolidada de todos os animais jovens da fazenda, com busca rápida por brinco e filtros por fase de desenvolvimento e sexo,  
Para gerenciar lotes de baias e piquetes de recria de maneira organizada no curral, com opção de ignorar machos quando focar na reposição.

**Why this priority**: Permite ao operador localizar animais em segundos em campo e saber quantas bezerras estão em cada lote ou piquete.

**Independent Test**: Abrir a aba "Bezerras" e alternar entre os filtros "Em Aleitamento", "Em Desmame", "Desmamadas" e "Aptas para IA", e alternar o seletor de sexo entre "Fêmeas" e "Todos"; a lista filtra instantaneamente os cartões exibindo brinco, idade, fase e último peso.

**Acceptance Scenarios**:
1. **Given** a tela de listagem de bezerras, **When** o usuário pesquisa pelo número do brinco ou nome, **Then** a lista filtra em tempo real com busca incremental.
2. **Given** a listagem, **When** o usuário toca no filtro "Em Desmame", **Then** são exibidas apenas as bezerras na janela de 101 a 121 dias de vida.
3. **Given** animais machos cadastrados, **When** o tratador visualiza a lista com o filtro "Fêmeas" ativo, **Then** os bezerros machos são ocultados da tela.
4. **Given** um bezerro macho selecionado, **When** seu prontuário é exibido, **Then** os cálculos de leite e pesagens funcionam integralmente, mas a régua de meta de 1ª IA é omitida.

---

## Edge Cases

- **Bezerra cadastrada retroativamente**: Se a bezerra for cadastrada com data de nascimento há mais de 122 dias, o plano alimentar deve iniciar diretamente como "Desmamada (0 L)", exibindo aviso de registro histórico e `lifeStage` definido como `novilha`.
- **Pesagem com perda de peso (GMD negativo)**: Se o peso atual for menor que o anterior (devido a desmame ou enfermidade), o sistema deve calcular o GMD negativo normalmente, exibindo badge em vermelho de alerta (`danger`).
- **Pesagens no mesmo dia (intervalo de zero dias)**: Se o usuário registrar duas pesagens na mesma data, o sistema deve atualizar a pesagem do dia ou bloquear cálculo de divisão por zero (`dias = 0`), mantendo a última pesagem válida.
- **Ascendente desconhecido**: Quando a mãe, pai ou avó não forem conhecidos (animal comprado sem pedigree), os campos devem aceitar estado "Desconhecido" sem quebrar a árvore genealógica de 3 níveis.
- **Novilha inseminada que retorna ao bezerreiro**: Ao receber a 1ª inseminação na aba Reprodução, o status reprodutivo do animal passa a ser gerenciado pelo módulo reprodutivo (`inseminada`), mas seu histórico de pesagens permanece acessível para consulta na aba Bezerras.
- **Data do simulador de manejo ativa**: Todas as idades em dias, transições de fases e linhas do tempo de desmame devem ser calculadas com base na `activeDate` do simulador de manejo do ReproLeite.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir o cadastro de novos animais com estágio de vida `bezerra` contendo: brinco (obrigatório, numérico), nome (opcional), sexo (fêmea ou macho), data de nascimento (obrigatória, formato YYYY-MM-DD), peso de nascimento em kg (padrão 40,0 kg caso omitido).
- **FR-002**: O sistema DEVE validar a unicidade do brinco entre os animais ativos da fazenda (`farm_id`), impedindo duplicidade no cadastro.
- **FR-003**: O sistema DEVE registrar vínculos genealógicos de 3 níveis: Bezerra $\rightarrow$ Mãe (selecionada do catálogo de vacas do rebanho), Pai (selecionado do catálogo de touros de sêmen/reprodutores) e Avó Materna (opcional via campo de texto livre).
- **FR-004**: Ao selecionar uma mãe cadastrada no rebanho que já possua ascendente materna registrada, o sistema DEVE auto-preencher o campo de texto da Avó Materna da bezerra, permitindo edição.
- **FR-005**: O sistema DEVE implementar motor determinístico puro de cálculo de plano de aleitamento baseado na idade exata em dias (diferença em UTC entre a data de referência ativa e a data de nascimento):
  - *0 a 15 dias*: 4 L/dia (2 L manhã + 2 L tarde) - Fase Inicial.
  - *16 a 100 dias*: 8 L/dia (4 L manhã + 4 L tarde) - Fase de Pico.
  - *101 a 107 dias*: 4 L/dia (2 L manhã + 2 L tarde) - 1ª semana de corte.
  - *108 a 114 dias*: 2 L/dia (1 L manhã + 1 L tarde) - 2ª semana de corte.
  - *115 a 121 dias*: 1 L/dia (1 L apenas manhã) - 3ª semana de corte.
  - *122+ dias*: 0 L/dia - Desmamada.
- **FR-006**: O sistema DEVE gerar uma linha do tempo de desmame calculando as datas civis exatas para os marcos de corte (101d, 108d, 115d e 122d) a partir da data de nascimento e data ativa.
- **FR-007**: O sistema DEVE permitir o registro de pesagens periódicas para cada animal em tabela dedicada (`weighings`), armazenando: data da pesagem, peso em kg (numérico com 1 casa decimal) e observações textuais opcionais.
- **FR-008**: O sistema DEVE calcular automaticamente o Ganho Médio Diário (GMD) em gramas por dia (`g/dia`) entre duas pesagens consecutivas ordenadas cronologicamente: `((peso_atual - peso_anterior) / dias_decorridos) * 1000`.
- **FR-009**: O sistema DEVE promover automaticamente o animal para o estágio de vida `novilha` ao atingir 122 dias de vida (desmame total).
- **FR-010**: O sistema DEVE exibir a evolução do peso de fêmeas em recria através de régua/barra de progresso tendo como meta 360,0 kg para a 1ª Inseminação Artificial.
- **FR-011**: Ao atingir ou superar 360,0 kg, o sistema DEVE sinalizar a novilha com o selo "Apta para 1ª IA" e habilitar botão de ação rápida para lançar a 1ª Inseminação.
- **FR-012**: O botão "Lançar 1ª Inseminação" DEVE redirecionar o usuário para a rota de reprodução com o parâmetro `preselectedAnimalId` da novilha apta (`/(tabs)/reproducao?action=inseminate&animalId=${animalId}`).
- **FR-013**: O sistema DEVE permitir o cadastro e acompanhamento nutricional de bezerros machos, disponibilizando controle de filtros na listagem para ignorá-los/ocultá-los quando o foco for fêmeas de reposição, e suprimindo a régua de 1ª IA para machos.
- **FR-014**: Todas as operações de leitura e escrita DEVEM persistir exclusivamente no banco local SQLite, integrando com fila transacional de outbox para posterior sincronização em nuvem.
- **FR-015**: Os botões de ação primária no curral (como "Cadastrar Bezerra", "Lançar Pesagem", "Lançar 1ª Inseminação") DEVEM ter área de toque mínima de 56 px de altura (`min-h-14`), e controles secundários $\ge 48\text{ px}$.
- **FR-016**: Todos os campos numéricos de entrada (brinco, peso de nascimento, pesagem periódica) DEVEM abrir teclado numérico por padrão.
- **FR-017**: A interface DEVE dispor de calculadora interativa de aleitamento, permitindo ao tratador simular litros e datas a partir de uma data de nascimento ou idade qualquer.

---

### Key Entities

- **Animal (Bezerra/Novilha)**:
  - Identificador único (`id`), fazenda (`farm_id`), brinco (`ear_tag`), brinco normalizado (`ear_tag_normalized`), nome (`name`), sexo (`sex`: 'femea' | 'macho'), raça (`breed`), data de nascimento (`birth_date`), peso de nascimento (`birth_weight_kg`), estágio de vida (`life_stage`: 'bezerra' | 'novilha'), status reprodutivo (`repro_status`), mãe (`dam_id`, `dam_name`), pai (`sire_id`, `sire_name`), avó materna (`maternal_grandsire_name` / texto de avó materna), status de saída (`exit_status`), timestamps de auditoria e exclusão lógica.
- **Weighing (Pesagem)**:
  - Identificador único (`id`), fazenda (`farm_id`), animal (`animal_id`), data da pesagem (`date`), peso em kg (`weight_kg`), observações (`notes`), timestamps de auditoria (`created_at`, `updated_at`) e exclusão lógica (`deleted_at`).
- **FeedingPlan (Plano Alimentar Derivado)**:
  - Fase atual (`stage`: 'inicial' | 'pico' | 'desmame' | 'desmamada'), nome da fase, litros manhã, litros tarde, total diário, descrição e cor semântica do selo.
- **WeaningTimeline (Linha do Tempo de Desmame Derivada)**:
  - Data de início do pico (16d), corte 1 (101d), corte 2 (108d), corte 3 (115d) e desmame total (122d), com indicador do estágio em que a bezerra se encontra hoje.
- **DailyGainSummary (Resumo de GMD Derivado)**:
  - Peso atual, peso anterior, dias decorridos, GMD do último período (`g/dia`), GMD acumulado desde o nascimento (`g/dia`), progresso percentual até a meta de 360 kg e kg faltantes.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O tratador consegue cadastrar uma nova bezerra com genealogia de 3 níveis em menos de 45 segundos no curral.
- **SC-002**: O cálculo da fase de aleitamento e dos volumes de leite é 100% determinístico e recalcula instantaneamente (< 50 ms) ao alterar a data ativa do simulador.
- **SC-003**: 100% das pesagens registradas exibem o GMD calculado sem necessidade de conexão com a internet.
- **SC-004**: Ao atingir 360 kg, o fluxo de transição para inseminação requer no máximo 2 toques na tela para abrir o formulário com o animal pré-selecionado.
- **SC-005**: 100% das ações de campo utilizam botões táteis com altura $\ge 48\text{ px}$ (56 px nas ações principais), garantindo ergonomia para uso com luvas e sob luz solar intensa.
- **SC-006**: A totalização dos litros diários do bezerreiro é 100% consistente com a soma individual de todas as bezerras ativas da fazenda.

---

## Assumptions

- O peso padrão de nascimento para a raça leiteira predominante (Holandesa / Girolando) é de 40,0 kg quando o peso real não for aferido na maternidade.
- A curva de aleitamento padrão adotada pelo projeto possui 6 degraus e desmame total aos 122 dias de vida, conforme estabelecido no plano zootécnico do ReproLeite.
- A meta de peso corporal para a 1ª Inseminação Artificial de novilhas é fixada em 360,0 kg (peso zootécnico recomendado para raças leiteiras atingirem maturidade reprodutiva aos 14-16 meses).
- Os registros de pesagens utilizam soft delete e outbox transacional idênticos aos demais registros de manejo para sincronização segura.
- Bezerros machos utilizam a mesma curva de aleitamento até o desmame/destino na fazenda, com supressão de indicadores reprodutivos femininos.
