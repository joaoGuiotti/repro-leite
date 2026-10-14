# Feature Specification: Inseminação Rápida no Curral com Baixa de Doses, Projeções Reprodutivas e Alerta de Consanguinidade

**Feature Branch**: `002-inseminacao-rapida`

**Created**: 2026-10-14

**Status**: Ready for Planning

**Input**: User description: "002-inseminacao-rapida: Aba 'Inseminar' (Lançamento Rápido no Curral & Projeções Imediatas). Usar máximo de componente de src/ui, caso não tenha crie para reaproveitarmos no futuro"

## Clarifications

### Session 2026-10-14
- Q: Como deve ser o fluxo de lançamento no curral quando o inseminador insemina várias vacas em sequência com o mesmo sêmen e protocolo? → A: Individual com atalho "Salvar e Inseminar Outra": grava a atual e já abre imediatamente a busca da próxima vaca mantendo touro, data e inseminador pré-selecionados.
- Q: Quando o inseminador seleciona um touro que está com saldo zerado no catálogo, como o sistema deve permitir resolver essa situação sem interromper a lida no curral? → A: Aviso com atalho de entrada rápida de doses: permite confirmar a IA mesmo assim ("Inseminar mesmo assim") ou acionar "+ Adicionar Doses" para atualizar o saldo do touro diretamente na tela sem perder os dados da inseminação.
- Q: Ao abrir o modal de seleção rápida da fêmea (SeletorItemModal), como a listagem de animais deve se comportar para agilizar a localização da vaca no curral? → A: Foco em aptas com busca universal: exibe fêmeas aptas (vazias e novilhas) no topo com pílulas de filtro rápido de status, permitindo buscar qualquer fêmea ativa pelo número do brinco com teclado numérico.
- Q: Ao excluir ou cancelar uma inseminação lançada por engano, como o sistema deve determinar o status reprodutivo para o qual a vaca deve retornar? → A: Restauração inteligente por histórico: o motor zootécnico avalia o histórico do animal; se houver IA anterior ativa em aberto, restaura para "Inseminada" e reativa seus alertas; caso contrário, define como "Vazia".
- Q: Como o usuário deve acessar o fluxo de Inseminação Rápida a partir da aba "Reprodução" no aplicativo? → A: Seção dedicada + atalho no cartão da vaca: adiciona a 3ª seção "Inseminar" no seletor de topo da aba Reprodução (Rebanho | Touros | Inseminar) e atalho direto "Inseminar" no cartão de vacas vazias/aptas que abre o formulário com a vaca pré-carregada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inseminação em 3 Toques no Curral (Priority: P1)

Como vaqueiro ou inseminador na lida do curral, quero registrar uma inseminação artificial em uma fêmea apta com apenas 3 ações principais (selecionar a vaca por busca rápida de brinco, selecionar o touro pelo catálogo ou nome avulso e confirmar a data do procedimento com o nome do inseminador), para que eu possa lançar o manejo em menos de 30 segundos com uma mão enquanto seguro o aplicador de IA ou contenho o animal no tronco.

**Why this priority**: É o fluxo operacional mais crítico da reprodução da fazenda. Qualquer atrito, lentidão ou excesso de campos faz o operador desistir de usar o celular no curral e voltar ao papel, prejudicando o controle da fazenda.

**Independent Test**: Pode ser testado abrindo o formulário de inseminação, buscando uma vaca pelo brinco com teclado numérico, selecionando um touro cadastrado no catálogo com saldo de doses e clicando no botão de confirmação "Registrar Inseminação"; o status da vaca deve mudar para "Inseminada" e a inseminação deve ser salva localmente.

**Acceptance Scenarios**:

1. **Given** que o usuário está na tela de Inseminação Rápida, **When** ele aciona o seletor da fêmea, **Then** o sistema abre o `SeletorItemModal` exibindo prioritariamente fêmeas aptas ("Vazias" e "Novilhas aptas") no topo, com pílulas de filtro rápido de status (`SeloStatus`), e permite digitar o número do brinco em teclado numérico para filtrar instantaneamente qualquer fêmea ativa da fazenda.
2. **Given** que uma vaca foi selecionada, **When** o usuário abre a seleção de touros, **Then** o sistema exibe a lista de touros cadastrados com saldo de doses disponível em destaque (ex.: "Jaguar TE — 12 doses"), permitindo também a opção de digitar um nome de touro avulso não cadastrado.
3. **Given** vaca e touro selecionados, **When** o usuário visualiza a data do procedimento (preenchida automaticamente com a data de manejo do simulador/sistema) e o nome do inseminador (preenchido com o último utilizado), **Then** os botões primários "Confirmar e Concluir" e "Confirmar e Inseminar Outra" (mínimo 56 px de altura) ficam ativos para gravação imediata.
4. **Given** que o usuário toca em "Confirmar e Concluir", **When** o registro é finalizado, **Then** o sistema atualiza o status da fêmea para "Inseminada", armazena o evento localmente no SQLite e limpa o formulário pronto para novo uso.
5. **Given** que o usuário está inseminando várias vacas em sequência e toca em "Confirmar e Inseminar Outra", **When** a gravação da primeira vaca é concluída com sucesso, **Then** o sistema persiste o registro e reabre imediatamente a seleção de animal, mantendo o mesmo touro, data e inseminador selecionados.
6. **Given** que o usuário está na listagem geral do rebanho na aba Reprodução, **When** ele toca no atalho direto "Inseminar" exibido no cartão de uma vaca vazia ou apta, **Then** o sistema alterna para a seção de Inseminação Rápida já com a vaca correspondente selecionada, pronta para a escolha do touro.

---

### User Story 2 - Painel de Projeções Zootécnicas Imediatas (Priority: P1)

Como produtor rural ou inseminador, quero visualizar imediatamente na tela um painel resumo com as 4 datas projetadas do ciclo reprodutivo (retorno de cio aos 21 dias, toque/diagnóstico aos 45 dias, previsão de parto aos 282 dias e secagem aos 222 dias / parto menos 60 dias) antes e logo após confirmar a inseminação, para que eu tenha certeza visual dos prazos biológicos gerados para aquela vaca.

**Why this priority**: A visualização imediata dos prazos dá segurança zootécnica ao operador no curral e permite planejar os lotes de diagnóstico e secagem sem depender de cálculos mentais ou calendários de papel.

**Independent Test**: Pode ser testado selecionando uma data de inseminação (ex.: 2026-10-14) e verificando se os cartões de projeção exibem exatamente: Retorno do Cio em 2026-11-04 (+21d), Toque/Palpação em 2026-11-28 (+45d), Parto Previsto em 2026-07-23 (+282d) e Secagem em 2026-05-24 (-60d do parto).

**Acceptance Scenarios**:

1. **Given** que a data da inseminação foi selecionada, **When** a data é alterada ou confirmada, **Then** o painel de projeção calcula deterministicamente e exibe de forma legível sob luz solar:
   - 📅 **Vigiar Retorno do Cio**: Data da IA + 21 dias.
   - 🩺 **Diagnóstico de Gestação (Toque)**: Data da IA + 45 dias.
   - 🍼 **Parto Previsto**: Data da IA + 282 dias (~9 meses).
   - 🛑 **Secagem da Vaca**: Parto Previsto - 60 dias.
2. **Given** que a inseminação foi salva, **When** o sistema persiste o registro, **Then** são criados automaticamente registros de alerta zootécnicos vinculados àquele animal com os respectivos prazos para alimentar a rotina diária de curral (Feature 003).

---

### User Story 3 - Baixa Automática e Controle de Estoque de Palhetas de Sêmen (Priority: P1)

Como gestor do rebanho, quero que a confirmação da inseminação subtraia automaticamente 1 dose do estoque de palhetas do touro selecionado (quando for um touro cadastrado no catálogo), para que o saldo de doses no botijão de nitrogênio permaneça sempre sincronizado com o uso real no curral sem necessidade de lançamentos manuais adicionais.

**Why this priority**: O controle de botijão de sêmen é um ponto crítico de perda financeira e parada de serviço por falta de palhetas. A baixa automática vinculada à IA elimina esquecimentos de anotação.

**Independent Test**: Pode ser testado selecionando um touro com saldo de 5 doses, realizando uma inseminação com sucesso e verificando se o saldo do touro passa imediatamente para 4 doses tanto na lista de touros quanto no banco de dados local.

**Acceptance Scenarios**:

1. **Given** que o usuário selecionou um touro cadastrado com 8 doses disponíveis, **When** ele confirma a inseminação, **Then** o sistema debita exatamente 1 dose, atualizando o saldo do touro para 7 doses de forma atômica no banco local.
2. **Given** que o usuário selecionou um touro cujo estoque atual de palhetas está zerado (0 doses), **When** o touro é selecionado, **Then** o sistema exibe um aviso em destaque permitindo duas ações: "Inseminar mesmo assim" (mantendo saldo em 0) ou "+ Adicionar Doses" (abrindo diálogo rápido com `CampoNumerico` para adicionar as palhetas recém-chegadas e debitar a utilizada sem sair da tela).
3. **Given** que o usuário optou por digitar um touro avulso (não cadastrado no catálogo de doses), **When** a inseminação é salva, **Then** o nome do touro avulso é registrado no histórico da inseminação sem alterar nenhum estoque existente.

---

### User Story 4 - Alerta Visual de Consanguinidade e Prevenção de Endogamia (Priority: P2)

Como gestor zootécnico e inseminador, quero ser alertado com destaque visual imediato caso o touro selecionado seja pai ou avô (materno ou paterno) da vaca a ser inseminada, para que eu evite acasalamentos consanguíneos prejudiciais à genética e à saúde do rebanho antes de descongelar a palheta.

**Why this priority**: A endogamia (consanguinidade fechada pai x filha ou avô x neta) provoca queda de fertilidade, mortalidade neonatal e anomalias genéticas no gado leiteiro. Um alerta preventivo no momento da escolha do touro evita cruzamentos acidentais.

**Independent Test**: Pode ser testado cadastrando uma novilha cuja genealogia aponta o touro "Jaguar TE" como pai (`sire_id` ou `sire_name`), selecionando essa novilha na tela de inseminação e em seguida escolhendo o touro "Jaguar TE"; um banner amarelo de advertência de consanguinidade deve surgir instantaneamente na tela.

**Acceptance Scenarios**:

1. **Given** que a vaca selecionada possui o touro "Touro A" registrado como pai na sua ficha genealógica, **When** o usuário seleciona "Touro A" para inseminá-la, **Then** o sistema exibe um banner de alerta âmbar com texto destacado: "Atenção: Consanguinidade de 1º Grau detectada (Touro A é pai desta vaca)".
2. **Given** que a vaca selecionada possui "Touro B" registrado como avô (materno ou paterno), **When** o usuário seleciona "Touro B", **Then** o sistema exibe um alerta âmbar informando parentesco de 2º grau (avô).
3. **Given** que o alerta de consanguinidade foi exibido, **When** o usuário opta conscientemente por prosseguir (decisão zootécnica de acasalamento orientado), **Then** o sistema permite a confirmação mediante confirmação no banner ("Prosseguir mesmo assim"), registrando o alerta no histórico.

---

### User Story 5 - Histórico Recente e Cancelamento com Estorno de Dose (Priority: P2)

Como inseminador no curral, quero poder visualizar uma listagem das últimas inseminações realizadas na data atual e ter a opção de cancelar ou excluir uma inseminação lançada por engano (por exemplo, erro na digitação do brinco), com estorno opcional da dose de sêmen debitada, para corrigir rapidamente falhas operacionais sem corromper o histórico do animal.

**Why this priority**: No curral com poeira, barulho e pressa, erros de digitação de brinco acontecem. Ter como desfazer um lançamento recente em poucos toques evita inconsistências graves nos prazos e no estoque.

**Independent Test**: Pode ser testado registrando uma IA para o brinco "101" com touro que possuía 10 doses (passando para 9). Em seguida, acionar a opção "Cancelar/Excluir Inseminação" na lista de recentes confirmando o estorno da dose; o animal "101" deve voltar ao status anterior ("Vazia") e o estoque do touro deve retornar para 10 doses.

**Acceptance Scenarios**:

1. **Given** que foram lançadas 3 inseminações no dia, **When** o usuário acessa a seção de histórico recente na mesma tela ou modal, **Then** são listados os animais inseminados com brinco, touro, horário e inseminador.
2. **Given** que uma inseminação foi lançada para o brinco errado, **When** o usuário toca no botão de opções e seleciona "Excluir Registro", **Then** o sistema apresenta confirmação com opção de "Devolver 1 dose ao estoque do touro".
3. **Given** a confirmação de exclusão com devolução de dose, **When** a ação é confirmada, **Then** o registro da inseminação recebe exclusão segura, os alertas futuros associados a ela são cancelados, o saldo do touro é incrementado em 1 dose e o status reprodutivo do animal é recalculado deterministicamente pelo motor zootécnico com base no histórico restante (retornando a "Inseminada" caso exista IA anterior aberta ou "Vazia" caso não haja outro evento ativo).

---

### User Story 6 - Componentização Reutilizável para Ergonomia Rural (`src/ui`) (Priority: P2)

Como desenvolvedor e mantenedor da plataforma ReproLeite, quero que a interface de Inseminação utilize ao máximo os componentes visuais padronizados em `src/ui/` e que os novos padrões visuais introduzidos por esta tela (como seletores táteis de animais/touros, cartões de projeção de prazos e banners de alerta de consanguinidade) sejam implementados como componentes atômicos em `src/ui/`, para que sejam reaproveitados nas próximas features (`003-hoje-no-curral`, `004-bezerras-aleitamento-recria` e `005-ajustes-e-backup`).

**Why this priority**: Segue estritamente a solicitação do usuário e o princípio constitucional de consistência de design tokens, evitando duplicação de estilos e garantindo acessibilidade rural padronizada (alvos de toque mínimos de 48px/56px e alto contraste sob sol intenso).

**Independent Test**: Pode ser testado verificando se os componentes `BannerAlerta`, `PainelProjecaoZootecnica`, `SeletorItemModal` e `BadgeEstoqueDoses` estão exportados no índice de `src/ui/` e são consumidos na tela de inseminação sem classes soltas ou concatenadas dinamicamente.

**Acceptance Scenarios**:

1. **Given** a necessidade de alertar consanguinidade ou avisos no curral, **When** renderizado o componente `BannerAlerta` de `src/ui/`, **Then** ele apresenta ícone temático (`lucide-react-native`), tipografia legível sob luz solar direta, borda e fundo em tons da paleta de design e suporte a ação de confirmação/dispensa.
2. **Given** a exibição das 4 datas reprodutivas, **When** renderizado o componente `PainelProjecaoZootecnica` de `src/ui/`, **Then** ele organiza os marcos em cartões estruturados com rótulo, data formatada em `DD/MM/AAAA` e contagem de dias relativos (`+21d`, `+45d`, `+282d`, `-60d`).
3. **Given** a seleção de fêmeas e touros, **When** acionado o componente `SeletorItemModal` de `src/ui/`, **Then** ele abre um modal acessível com campo de busca numérica ou textual e itens de lista com altura mínima de 48px.

---

### Edge Cases

- **Inseminação em fêmea com status atual "Inseminada" ou "Prenhe":** Se o operador selecionar uma vaca que já possui uma inseminação ativa recente ou diagnóstico de prenhez, o sistema DEVE emitir um diálogo de atenção: *"Esta vaca já foi inseminada em [Data]. Lançar nova inseminação substituirá o ciclo ativo e cancelará os alertas da inseminação anterior. Deseja prosseguir?"*.
- **Tentativa de inseminar animal macho:** O seletor de animais DEVE filtrar exclusivamente animais do sexo feminino (`sex === 'femea'`), impedindo a seleção de machos.
- **Inseminação em bezerra lactante ou muito jovem:** Se a fêmea selecionada tiver menos de 10 meses de idade (estágio de vida de bezerra), o sistema DEVE exibir um aviso alertando que o animal pode não ter atingido a idade reprodutiva mínima, solicitando confirmação.
- **Touro com saldo de doses zerado no momento da confirmação:** O sistema DEVE alertar o usuário com clareza, mas NÃO bloquear o registro da IA no curral se o produtor confirmar que utilizou uma palheta física real do botijão que ainda não havia sido lançada no estoque digital.
- **Data da inseminação no futuro:** O sistema DEVE validar e impedir que a data da inseminação seja configurada para uma data posterior à data de manejo atual (simulador/hoje).
- **Consanguinidade com pai/avô sem cadastro completo:** A verificação de consanguinidade DEVE comparar tanto os identificadores (`sire_id`) quanto os nomes normalizados (`sire_name`), cobrindo touros cadastrados e touros registrados por texto livre na genealogia da vaca.
- **Operação 100% offline no curral:** Nenhuma operação de busca, cálculo de projeções, débito de dose ou gravação pode realizar chamadas de rede síncronas ou falhar por ausência de conectividade.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar o fluxo de Inseminação Rápida na aba "Reprodução" através de duas portas de entrada integradas: (1) uma seção dedicada "Inseminar" no seletor superior de navegação da aba (`Rebanho` | `Touros` | `Inseminar`) para a lida geral no curral, e (2) um botão de atalho rápido "Inseminar" diretamente no cartão de cada fêmea apta/vazia na listagem do rebanho, que direciona para o formulário com o animal já pré-selecionado.
- **FR-002**: O sistema DEVE permitir a seleção da fêmea receptora através de modal de busca ágil (`SeletorItemModal`), listando prioritariamente fêmeas aptas ("Vazias" e "Novilhas aptas para IA") no topo, com pílulas de filtro rápido por status reprodutivo (`SeloStatus`), e permitindo que a busca por número do brinco (com teclado numérico nativo prioritário) ou nome/apelido localize instantaneamente qualquer fêmea ativa do rebanho.
- **FR-003**: O sistema DEVE permitir a seleção do reprodutor através de duas modalidades:
  - Seleção de touro cadastrado no catálogo com exibição do saldo de doses restante.
  - Digitação de nome de touro avulso (não catalogado).
- **FR-004**: O sistema DEVE preencher a data do procedimento por padrão com a data de manejo ativa no simulador temporal / sistema, permitindo alteração através do componente de seleção de data caso o usuário esteja registrando um manejo ocorrido no passado.
- **FR-005**: O sistema DEVE permitir informar o nome do inseminador responsável pelo procedimento, memorizando localmente o último nome informado como padrão para os próximos lançamentos.
- **FR-006**: O sistema DEVE calcular deterministicamente e exibir em tempo real na interface o Painel de Projeções Zootécnicas com os 4 marcos reprodutivos:
  - Retorno do Cio: Data da IA + 21 dias.
  - Exame de Toque/Diagnóstico de Gestação: Data da IA + 45 dias.
  - Previsão de Parto: Data da IA + 282 dias.
  - Secagem da Vaca: Previsão de Parto - 60 dias (Data da IA + 222 dias).
- **FR-007**: O sistema DEVE executar a verificação de consanguinidade imediata entre a fêmea e o reprodutor selecionado:
  - Se o touro for pai da fêmea (`sire_id` idêntico ou `sire_name` compatível), exibir banner de alerta âmbar com advertência de consanguinidade de 1º grau.
  - Se o touro for avô materno ou avô paterno da fêmea, exibir banner de alerta âmbar com advertência de consanguinidade de 2º grau.
  - O sistema DEVE permitir ao produtor prosseguir com o lançamento após ciência explícita do alerta.
- **FR-008**: O sistema DEVE subtrair automaticamente 1 dose do saldo de palhetas do touro selecionado quando for um touro do catálogo cadastrado.
- **FR-009**: O sistema DEVE tratar a seleção de touro com estoque zerado exibindo um aviso contextual com opção de prosseguir ("Inseminar mesmo assim", mantendo o saldo em 0) ou acionar um atalho de abastecimento rápido ("+ Adicionar Doses"), permitindo atualizar o saldo de palhetas do touro imediatamente no banco local sem perder a seleção atual e sem sair do fluxo de inseminação.
- **FR-010**: Ao confirmar o registro de inseminação com sucesso, o sistema DEVE:
  - Gravar o registro da inseminação na tabela `inseminations` com os dados completos e datas projetadas.
  - Atualizar o status reprodutivo da fêmea para `inseminada`.
  - Gerar os registros correspondentes na tabela de alertas (`alerts`) para observação de cio aos 21 dias e toque aos 45 dias.
  - Disparar atualização atômica do saldo do touro (quando aplicável).
- **FR-011**: Caso a vaca selecionada já possua status `inseminada` ou `prenhe`, o sistema DEVE exigir confirmação explícita do usuário informando que a nova inseminação substituirá o ciclo reprodutivo anterior e superará os alertas precedentes.
- **FR-012**: O sistema DEVE exibir uma listagem de inseminações recentes realizadas na fazenda, permitindo visualizar detalhes do procedimento e prazos gerados.
- **FR-013**: O sistema DEVE disponibilizar ação de cancelamento/exclusão de uma inseminação lançada por engano, permitindo opcionalmente estornar a dose de sêmen debitada para o estoque do touro e recalculando deterministicamente o status reprodutivo da vaca com base no histórico zootécnico remanescente (restaurando para "inseminada" com seus respectivos alertas caso haja IA anterior em aberto, ou para "vazia" caso contrário).
- **FR-014**: Todos os dados persistidos DEVEM conter `id` (UUID v4), `farm_id` (UUID multi-tenant), `created_at` (UTC), `updated_at` (UTC) e suportar exclusão lógica via `deleted_at`.
- **FR-015**: Todas as gravações e leituras DEVEM operar de modo 100% offline no SQLite local, enfileirando as mutações para sincronização posterior em segundo plano.
- **FR-016**: A interface DEVE reutilizar os componentes existentes em `src/ui/`: `Botao`, `CampoNumerico`, `CampoTexto`, `Cartao`, `ModalPadrao`, `SeloStatus`, `SelectDate`, `CabecalhoDataSimulador`.
- **FR-017**: A interface DEVE introduzir e padronizar na pasta `src/ui/` os seguintes novos componentes reutilizáveis:
  - `BannerAlerta`: Componente de aviso contextual com suporte a variantes (alerta, atenção, sucesso), ícone temático e ação de confirmação ou fechamento.
  - `PainelProjecaoZootecnica`: Grid/cartões de projeções reprodutivas com rótulos, datas calculadas e contagem de dias relativos.
  - `SeletorItemModal`: Modal com campo de busca ágil e lista otimizada com alvos de toque de 48px/56px para seleção rápida de vacas ou touros.
  - `BadgeEstoqueDoses`: Selo visual para exibição de saldo de doses com codificação por cores baseada na disponibilidade (verde, âmbar, vermelho).
- **FR-018**: Os botões de ação primária ("Confirmar e Concluir", "Confirmar e Inseminar Outra", "Selecionar Vaca", "Selecionar Touro") DEVEM ter altura mínima de 56 px (`min-h-14`) e contraste visual adequado para uso externo sob sol intenso.
- **FR-019**: O sistema DEVE disponibilizar no fluxo de confirmação a ação "Confirmar e Inseminar Outra", que persiste a inseminação da fêmea atual e reabre imediatamente a seleção de animal mantendo o reprodutor, data de manejo e inseminador previamente selecionados para acelerar inseminações sequenciais no curral.

---

### Key Entities *(include if feature involves data)*

- **Inseminacao (`inseminations`)**: Representa o evento zootécnico da inseminação artificial na fêmea bovina.
  - *Atributos*: Identificador único universal (UUID), identificador da fazenda (`farm_id`), identificador do animal (`animal_id`), identificador do touro do catálogo (`bull_id`, nulo se avulso), nome do touro (`bull_name`), data do procedimento (`date` no formato `YYYY-MM-DD`), nome do inseminador (`inseminator`), data prevista para retorno do cio (`expected_heat_date`), data prevista para toque/diagnóstico (`pregnancy_check_date`), data prevista para parto (`expected_calving_date`), data prevista para secagem (`dry_off_date`), resultado do ciclo (`result`: pendente, prenhe, vazia), observações operacionais (`notes`), timestamps de auditoria e exclusão lógica.
- **AlertaReprodutivo (`alerts`)**: Representa as notificações de manejo geradas a partir do evento reprodutivo para acompanhamento diário.
  - *Atributos*: Identificador único universal (UUID), identificador da fazenda (`farm_id`), identificador do animal alvo (`target_animal_id`), tipo do alerta (`heat_check_21d`, `pregnancy_check_45d`, `calving_due`, `dry_off`), data de vencimento do alerta (`due_date` no formato `YYYY-MM-DD`), data de conclusão (`completed_at`), identificador de origem (`source_id` apontando para a inseminação), timestamps de auditoria e exclusão lógica.
- **Touro (`bulls`)**: Entidade de reprodutor já existente, cujo atributo `straws_in_stock` sofre débito no momento da IA e crédito em caso de estorno por cancelamento.
- **Animal (`animals`)**: Entidade do rebanho já existente, cujo atributo `repro_status` é atualizado para `inseminada` ao concluir o procedimento.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O operador no curral consegue concluir o registro completo de uma inseminação em menos de 30 segundos a partir da abertura da tela.
- **SC-002**: O cálculo das 4 datas reprodutivas (21d, 45d, 282d, -60d) e a verificação de consanguinidade ocorrem instantaneamente na interface em menos de 100 milissegundos após a seleção da vaca e do touro.
- **SC-003**: 100% das inseminações confirmadas com touro cadastrado no catálogo debitam exatamente 1 dose de sêmen no estoque local de forma atômica e consistente.
- **SC-004**: 100% dos cruzamentos potenciais com parentesco de 1º grau (pai) ou 2º grau (avô) disparam o alerta visual de consanguinidade antes do botão de confirmação final.
- **SC-005**: 100% das operações de cadastro, cálculo de projeção e cancelamento funcionam perfeitamente sem qualquer conexão de internet (Modo Curral Offline).
- **SC-006**: Todos os novos componentes de interface criados (`BannerAlerta`, `PainelProjecaoZootecnica`, `SeletorItemModal`, `BadgeEstoqueDoses`) residem em `src/ui/` e são 100% reutilizáveis pelas telas subsequentes do aplicativo.

---

## Assumptions

- O aplicativo opera com a data do simulador de manejo como referência padrão para datas de procedimentos no curral; se o usuário alterar a data de manejo no cabeçalho superior, o formulário de inseminação adota essa nova data automaticamente.
- A gestação padrão considerada pelo motor zootécnico é de 282 dias (padrão biométrico do gado leiteiro Holandês e Girolando), com período seco pré-parto padrão de 60 dias.
- O ciclo estral médio considerado para retorno de cio é de 21 dias (com janela de vigia típica entre 18 e 24 dias, com marco central aos 21 dias).
- O diagnóstico de gestação por palpação transretal ou ultrassonografia veterinária ocorre a partir de 45 dias após a IA.
- O operador pode optar por inseminar com touro avulso (ex.: sêmen trazido de terceiro ou monta natural controlada), caso em que nenhum estoque de sêmen é debitado.
- Caso o estoque de palhetas de um touro esteja em zero no aplicativo, o sistema não deve impedir o trabalho de campo do inseminador, permitindo o registro mediante advertência explícita.
- A consanguinidade avalia pais e avós com base nos campos `sire_id`/`sire_name` e genealogia cadastrada do animal. Se o animal não possuir filiação cadastrada, nenhum alerta falso é disparado.
