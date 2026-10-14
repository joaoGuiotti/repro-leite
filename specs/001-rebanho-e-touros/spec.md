# Feature Specification: Rebanho & Catálogo de Touros com Estoque de Doses e Política de Brinco

**Feature Branch**: `001-rebanho-e-touros`

**Created**: 2026-10-14

**Status**: Ready for Planning

**Input**: User description: "001-rebanho-e-touros: Aba 'Rebanho & Touros' (Gestão cadastral de animais ativos/inativos, status reprodutivo, catálogo de touros e estoque de doses de sêmen)"

## Clarifications

### Session 2026-10-14
- Q: Ao cadastrar um animal adulto no rebanho, o usuário poderá definir diretamente o status reprodutivo inicial (ex.: Vazia, Inseminada, Prenhe, Seca), ou todo animal cadastrado inicia obrigatoriamente como "Vazia"? → A: Permitir selecionar o status reprodutivo inicial no formulário de cadastro (padrão *Vazia*, com opções *Inseminada*, *Prenhe* e *Seca*).
- Q: Ao cadastrar um animal do sexo masculino (macho) no rebanho, como o sistema deve tratar o status reprodutivo e a filtragem desse animal na lista? → A: Ocultar status reprodutivo para machos no formulário e excluí-los dos filtros reprodutivos específicos de fêmeas (exibindo-os apenas em "Todas").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Busca Instantânea e Filtragem do Rebanho no Curral (Priority: P1)

Como vaqueiro ou produtor no curral, quero localizar uma vaca digitando apenas os números do seu brinco ou seu nome, e filtrar rapidamente o rebanho pelo seu status reprodutivo (*Todas, Vazias, Inseminadas, Prenhes, Secas*), para que eu possa consultar a situação de qualquer animal em poucos segundos durante a lida diária sem perder tempo procurando em cadernos.

**Why this priority**: É a operação mais frequente no dia a dia da fazenda. Sem uma listagem ágil e uma busca instantânea por brinco com teclado numérico, o manejo no curral torna-se lento e ineficiente.

**Independent Test**: Pode ser testado abrindo a lista de animais, digitando o número de um brinco no campo de busca e confirmando que o animal correspondente surge instantaneamente no topo; em seguida, alternar entre os filtros de status reprodutivo e verificar a filtragem imediata.

**Acceptance Scenarios**:

1. **Given** que o usuário está na tela de Rebanho com 150 animais cadastrados, **When** ele digita "12" no campo de busca de brinco, **Then** o sistema filtra a lista em tempo real destacando primeiro os animais ativos cujo brinco contenha "12" ou cujo nome contenha o termo digitado.
2. **Given** que a lista exibe todo o rebanho ativo, **When** o usuário toca na pílula de filtro "Prenhes", **Then** a lista exibe exclusivamente os animais com status reprodutivo "Prenhe".
3. **Given** que a lista possui animais inativos (vendidos/mortos/descartados), **When** o usuário pesquisa por um brinco histórico, **Then** o sistema lista primeiro os animais ativos e, em seguida, os inativos identificados com selo visual "Inativo" e o ano de saída.

---

### User Story 2 - Cadastro Ágil de Animal com Política de Reuso de Brinco (Priority: P1)

Como operador no curral, quero cadastrar rapidamente uma nova vaca ou bezerra preenchendo apenas os dados essenciais (brinco, nome/apelido opcional, raça, sexo, data de nascimento e peso ao nascer), com validação imediata da disponibilidade do brinco, para que eu não cadastre acidentalmente dois animais ativos com o mesmo número, mas consiga reutilizar brincos de animais antigos que já deixaram a fazenda.

**Why this priority**: O brinco é a chave de identificação visual no gado leiteiro. Evitar duplicidades entre animais vivos na fazenda é vital para a integridade zootécnica, enquanto permitir o reuso consciente de brincos antigos reflete a realidade econômica dos produtores rurais.

**Independent Test**: Pode ser testado tentando cadastrar um animal com brinco já pertencente a uma vaca ativa (deve bloquear), depois com brinco de uma vaca vendida no ano passado (deve exibir aviso amarelo e permitir confirmação) e com brinco inédito (deve salvar diretamente).

**Acceptance Scenarios**:

1. **Given** que o brinco "405" já pertence à vaca ativa "Mimosa", **When** o usuário tenta cadastrar uma nova novilha com o brinco "405" (ou variações como " 405 " ou "a405"), **Then** o sistema bloqueia o salvamento e exibe o aviso "Brinco 405 já está em uso pela vaca Mimosa", oferecendo um atalho direto para visualizar a ficha do animal existente.
2. **Given** que o brinco "120" pertenceu à vaca "Estrela", registrada como vendida em 05/2024, **When** o usuário digita o brinco "120" no cadastro, **Then** o sistema exibe um aviso em destaque amarelo: "Brinco 120 pertenceu à vaca Estrela (vendida em 05/2024). Deseja reutilizar?", disponibilizando as opções "Usar mesmo assim" e "Mudar número".
3. **Given** que o usuário confirma "Usar mesmo assim" para o brinco "120", **When** ele preenche os demais campos obrigatórios e toca em "Salvar Animal", **Then** o novo animal é registrado com sucesso como ativo e o histórico do animal antigo permanece intacto sem nenhuma alteração.
4. **Given** que o usuário digita um brinco inédito, **When** ele informa raça e data de nascimento, **Then** o botão "Salvar Animal" é acionado e o animal é incluído imediatamente na lista de ativos.

---

### User Story 3 - Gestão de Saída e Inativação de Animais (Priority: P2)

Como gestor da fazenda, quero registrar a saída de um animal do rebanho ativo (motivos: venda, descarte involuntário, morte ou abate), informando a data e observação, para que a vaca deixe de figurar nas contagens ativas e tarefas diárias, liberando o brinco para reuso futuro sem perder seu histórico reprodutivo e genealógico.

**Why this priority**: Um rebanho leiteiro tem rotatividade contínua. Sem registro claro de saídas, animais que não estão mais na fazenda continuam gerando notificações de cio, toque ou secagem indevidas.

**Independent Test**: Pode ser testado abrindo a ficha de uma vaca ativa, selecionando a opção "Registrar Saída", escolhendo "Venda" e confirmando; a vaca deve desaparecer da lista de animais ativos e passar para a listagem histórica.

**Acceptance Scenarios**:

1. **Given** que uma vaca ativa foi vendida, **When** o usuário acessa sua ficha, seleciona "Registrar Saída", define o motivo "Vendido", a data da saída e confirma, **Then** o status do animal muda para inativo ("vendido"), ele é removido da lista padrão de animais ativos e seus alertas futuros são desativados.
2. **Given** que uma saída foi lançada por engano e o usuário deseja reativar o animal, **When** o brinco original ainda estiver livre, **Then** o sistema permite a reativação direta para o status "ativo".
3. **Given** que o usuário tenta reativar um animal cujo brinco já foi reutilizado por outro animal ativo, **When** ele solicita a reativação, **Then** o sistema exige que se altere o brinco de um dos dois antes de concluir a reativação.

---

### User Story 4 - Catálogo de Touros e Controle de Estoque de Palhetas de Sêmen (Priority: P2)

Como inseminador ou gestor, quero cadastrar os touros utilizados na fazenda (nome, raça, código da palheta e quantidade de doses em estoque) e gerenciar o saldo de palhetas disponíveis no botijão de nitrogênio, para que eu tenha controle preciso de quais touros estão disponíveis para inseminação e quais doses precisam ser repostas.

**Why this priority**: A reprodução leiteira depende da disponibilidade de sêmen. Saber exatamente quantas doses restam de cada touro antes de iniciar a rodada de inseminações no curral evita surpresas e atrasos no protocolo de reprodução.

**Independent Test**: Pode ser testado cadastrando um touro com 10 doses, ajustando o estoque manualmente (+/- doses) e verificando que o saldo é atualizado imediatamente no catálogo.

**Acceptance Scenarios**:

1. **Given** que o usuário adquiriu novas palhetas de sêmen, **When** ele acessa a aba "Touros", toca em "Novo Touro", informa nome ("Jaguar TE"), raça ("Gir Leiteiro"), código da palheta ("GIR-8821"), quantidade inicial de doses ("15") e salva, **Then** o touro passa a constar no catálogo com o saldo de 15 doses.
2. **Given** que o estoque físico foi conferido no botijão e divergente do sistema, **When** o usuário utiliza os controles rápidos de ajuste (+ / -) ou digita um novo número de doses, **Then** o saldo do touro é atualizado e gravado imediatamente.
3. **Given** que um touro está com 0 doses no estoque, **When** o usuário visualiza o catálogo, **Then** o cartão do touro exibe um alerta visual claro de "Estoque Zerado", mantendo o registro histórico para consultas genealógicas.

---

### Edge Cases

- **Brinco digitado com espaços ou caracteres minúsculos:** O sistema deve normalizar o brinco automaticamente (ex: " a-12 " torna-se "A12") para garantir que comparações e buscas identifiquem duplicidades independentemente da digitação.
- **Exclusão acidental vs. Saída do rebanho:** Se um animal foi cadastrado com dados errados por engano, o usuário pode "Excluir Registro" (ocultação segura); se o animal existiu e viveu na fazenda, o usuário deve "Registrar Saída" (venda/morte/descarte), preservando genealogia e produções passadas.
- **Tentativa de salvar estoque de doses negativo:** O sistema não deve permitir que o saldo de doses de sêmen fique inferior a zero, alertando o usuário caso uma redução exceda o disponível.
- **Dois aparelhos cadastrando o mesmo brinco sem internet (conflito offline):** O sistema deve registrar localmente em ambos; ao sincronizarem com a nuvem, o registro mais antigo é mantido e o segundo é sinalizado como "conflito de brinco pendente de novo número", sem perda dos dados zootécnicos lançados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar uma tela dedicada para visualização e busca do rebanho, com alternância facilitada entre a visualização de "Animais" e "Touros".
- **FR-002**: O sistema DEVE permitir a pesquisa rápida de animais pelo número do brinco ou por nome/apelido, com resposta visual instantânea.
- **FR-003**: O sistema DEVE disponibilizar filtros por status reprodutivo (*Todas, Vazias, Inseminadas, Prenhes, Secas*); animais do sexo masculino DEVEM ser automaticamente excluídos dos filtros reprodutivos específicos de fêmeas, sendo exibidos apenas no filtro geral "Todas" com selo de identificação de sexo.
- **FR-004**: O sistema DEVE aplicar uma política determinística de reuso de brinco:
  - Se o brinco informado pertencer a um animal **ativo**, o salvamento DEVE ser bloqueado e um link para a ficha do animal existente DEVE ser apresentado.
  - Se o brinco informado pertencer a um animal **inativo** (vendido, descartado, morto) ou excluído, o sistema DEVE apresentar aviso em destaque amarelo informando o histórico e exigindo confirmação ("Usar mesmo assim" ou "Mudar número").
  - Se o brinco for inédito, o cadastro DEVE prosseguir sem restrições.
- **FR-005**: O sistema DEVE normalizar o identificador do brinco (removendo espaços extras e padronizando maiúsculas) para todas as comparações de unicidade e buscas.
- **FR-006**: O formulário de cadastro de animal DEVE conter os seguintes campos: brinco (obrigatório, teclado numérico preferencial), nome/apelido (opcional), raça (obrigatório, com sugestões rápidas), sexo (fêmea ou macho, padrão fêmea), status reprodutivo inicial (selecionável apenas para fêmeas: padrão *Vazia*, com opções *Inseminada*, *Prenhe* e *Seca*; oculto para machos), data de nascimento (obrigatório) e peso de nascimento (padrão 40 kg, ajustável).
- **FR-007**: O sistema DEVE permitir visualizar e editar a ficha detalhada de cada animal, incluindo histórico cadastral, status reprodutivo atual e anotações zootécnicas.
- **FR-008**: O sistema DEVE permitir o registro de saída do rebanho, com seleção de motivo (*Vendido, Descartado, Morto*), data da saída e observações complementares.
- **FR-009**: O sistema DEVE permitir reativar um animal inativo, desde que seu brinco não esteja ocupado por outro animal ativo no momento da reativação.
- **FR-010**: O sistema DEVE manter o catálogo de touros, com campos para nome do touro, raça, código identificador da palheta, saldo atual de doses de sêmen em estoque e observações.
- **FR-011**: O sistema DEVE permitir o ajuste rápido do estoque de doses de palhetas de cada touro (+1, -1 ou digitação direta do saldo).
- **FR-012**: O sistema DEVE exibir destaque visual para touros com estoque de doses esgotado (0 doses).
- **FR-013**: Todas as operações de criação, edição, inativação e ajuste de estoque DEVEM funcionar de forma 100% offline, persistidas imediatamente no armazenamento local do dispositivo.
- **FR-014**: Todos os botões de ação primária ("Salvar", "Novo Animal", "Novo Touro", "Confirmar Saída") DEVEM possuir altura mínima de 56px e alto contraste visual adaptado para uso sob luz solar direta.
- **FR-015**: A exclusão de registros incorretos DEVE utilizar exclusão segura (soft delete), mantendo rastreabilidade para sincronização e evitando quebra de vínculos com outros registros.

### Key Entities *(include if feature involves data)*

- **Animal**: Representa qualquer fêmea ou macho bovino da fazenda.
  - *Atributos principais*: Identificador único universal, identificador da fazenda, brinco visual, brinco normalizado, nome/apelido, raça, sexo, data de nascimento, peso de nascimento, estágio de vida (*lactante, desmamada, recria, novilha apta para IA, novilha prenhe, vaca adulta*), status reprodutivo (*vazia, inseminada, prenhe, seca*), status de permanência (*ativo, vendido, descartado, morto*), data de saída, motivo de saída, data de criação, data de última atualização e data de exclusão segura.
- **Touro**: Representa os reprodutores cadastrados para inseminação artificial ou monta.
  - *Atributos principais*: Identificador único universal, identificador da fazenda, nome do touro, raça, código da palheta, saldo de doses em estoque, anotações, data de criação, data de última atualização e data de exclusão segura.
- **SaidaDoRebanho**: Representa o evento zootécnico de encerramento da permanência do animal no rebanho ativo.
  - *Atributos principais*: Tipo de saída (*venda, descarte, morte*), data do evento e justificativa operacional.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O vaqueiro consegue cadastrar um novo animal no curral em menos de 45 segundos, preenchendo os dados mínimos obrigatórios.
- **SC-002**: A busca por brinco retorna e destaca o animal correspondente na tela em menos de 200 milissegundos, mesmo com mais de 500 animais cadastrados.
- **SC-003**: 100% das tentativas de cadastrar um brinco em duplicidade com um animal ativo são bloqueadas pelo sistema, exibindo a identificação do animal detentor do brinco.
- **SC-004**: O reuso de brinco de animal inativo preserva 100% do histórico prévio do animal antigo e cria a ficha do novo animal com identificador independente.
- **SC-005**: 100% das alterações cadastrais e de estoque de sêmen são concluídas e salvas sem conexão de rede e sem perda de dados ao fechar o aplicativo.

## Assumptions

- Cada fazenda possui sua própria base isolada de animais e touros identificada universalmente.
- O brinco é a chave de trabalho no campo; a normalização trata variações comuns como prefixos minúsculos ("a10" vs "A10") e espaços involuntários no teclado numérico.
- O padrão da maioria dos animais cadastrados na exploração leiteira são fêmeas destinadas à reposição ou lactação; por isso, o sexo padrão no cadastro é "Fêmea".
- O estoque de doses de palheta é controlado por touro cadastrado e será automaticamente debitado em lançamentos de inseminação futuros (Feature 002).
- Os animais excluídos por erro operacional recebem exclusão lógica segura e liberam imediatamente o número do brinco para cadastros futuros.
