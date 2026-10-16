# Feature Specification: 006-conta-e-sync-supabase

**Feature Branch**: `006-conta-e-sync-supabase`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "seguir plano 006-conta-e-sync-supabase do roadmap docs/features_roadmap.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acesso Imediato no Curral & Entrada Opcional por Código OTP (Priority: P1)

Como produtor rural ou vaqueiro, desejo abrir o aplicativo e iniciar imediatamente o registro de manejos reprodutivos e zootécnicos no curral sem necessidade de internet nem login obrigatório prévio ("Acesso Imediato no Curral"), tendo a opção de conectar minha conta a qualquer momento na aba Ajustes através de um código de verificação de 6 dígitos enviado por e-mail (sem senhas estáticas), para ativar com segurança o backup em nuvem e a proteção do histórico da propriedade.

**Why this priority**: No meio rural, exigir telas de cadastro ou senhas antes do uso inicial inviabiliza o trabalho de campo sob sol forte e correria de manejo. A autenticação sem senha (OTP) elimina esquecimentos de credenciais e preserva a autonomia operacional imediata.

**Independent Test**: Pode ser testado abrindo o aplicativo em modo avião (acesso imediato sem login), navegando até a aba Ajustes ao restabelecer conexão, solicitando um código de 6 dígitos para um e-mail válido, informando o código recebido e confirmando que a sessão é ativada e persistida no aparelho sem deslogar indevidamente.

**Acceptance Scenarios**:

1. **Given** que o usuário abre o aplicativo pela primeira vez sem conexão com a internet e sem conta criada, **When** o aplicativo é iniciado, **Then** o sistema entra diretamente na interface de manejo do rebanho sem exigir login nem apresentar telas bloqueantes de cadastro.
2. **Given** que o usuário decide ativar o backup em nuvem da fazenda, **When** acessa a aba Ajustes, informa seu e-mail e toca em "Entrar com Código", **Then** o sistema envia um código de verificação de 6 dígitos para o endereço informado e exibe tela para inserção do código com contagem regressiva para solicitação de reenvio.
3. **Given** que o usuário digita o código correto recebido no e-mail, **When** a validação é concluída, **Then** a sessão do usuário é ativada e armazenada de forma segura no dispositivo, o status de conta conectada é exibido na aba Ajustes e a sincronização com a nuvem é ativada.
4. **Given** que o usuário digita um código de verificação expirado ou incorreto, **When** submete o código, **Then** o sistema apresenta mensagem amigável de erro informando a falha sem alterar os dados locais do rebanho.

---

### User Story 2 - Criação Automática e Vinculação da Fazenda à Conta (Priority: P1)

Como produtor rural que conectou sua conta pela primeira vez, desejo que minha fazenda local existente seja automaticamente vinculada à minha conta na nuvem (ou que uma nova fazenda seja criada caso seja o primeiro acesso), sem precisar configurar identificadores técnicos ou opções avançadas de banco de dados, garantindo o isolamento completo das minhas informações.

**Why this priority**: O produtor não deve ser onerado com conceitos técnicos de multi-tenancy ou parametrização de servidores; o processo de transição entre o modo offline isolado e o armazenamento em nuvem deve ser fluido, automático e seguro.

**Independent Test**: Pode ser testado cadastrando animais localmente em modo offline, conectando a conta por e-mail na aba Ajustes e verificando se os registros locais passam a pertencer à nova fazenda vinculada ao usuário proprietário na nuvem sem perder nenhuma relação genealógica ou histórico reprodutivo.

**Acceptance Scenarios**:

1. **Given** que o usuário possui animais e manejos cadastrados localmente no aparelho, **When** realiza seu primeiro acesso com a conta por e-mail, **Then** o sistema vincula automaticamente todos os registros locais existentes à fazenda atribuída ao usuário na nuvem, mantendo o usuário como proprietário da fazenda.
2. **Given** que o usuário já possui uma fazenda cadastrada na nuvem e entra em um dispositivo novo, **When** o login é concluído com sucesso, **Then** o sistema identifica a fazenda remota existente e a vincula como a fazenda ativa do dispositivo.

---

### User Story 3 - Sincronização Remota Bidirecional Automática e Resiliente (Priority: P1)

Como operador de campo que transita entre áreas sem sinal (curral, bezerreiro, pasto) e áreas conectadas (sede, escritório, casa), desejo que todos os registros efetuados (cadastros de vacas, touros, inseminações, pesagens de bezerras e alertas) sejam enviados para a nuvem de forma automática assim que houver sinal, e que novidades cadastradas por outros operadores da fazenda sejam recebidas em segundo plano, sem travar o aplicativo nem interromper minha rotina.

**Why this priority**: A consistência dos dados do rebanho entre a equipe de campo e o backup na nuvem é fundamental para evitar retrabalho, perda de dados por danos no celular e desencontro de informações zootécnicas.

**Independent Test**: Pode ser testado lançando uma inseminação ou pesagem em modo avião, restabelecendo a conexão de rede e verificando se o registro pendente é transmitido e confirmado na nuvem sem requerer ação manual do usuário.

**Acceptance Scenarios**:

1. **Given** que o usuário realizou registros ou alterações enquanto esteve sem sinal de internet, **When** o dispositivo se reconecta à rede ou o aplicativo retorna para o primeiro plano, **Then** o sistema processa automaticamente a fila de alterações locais pendentes e as transmite em lotes para a nuvem.
2. **Given** que outro membro da fazenda inseriu novos registros na nuvem, **When** a sincronização periódica do dispositivo é acionada, **Then** o sistema baixa incrementalmente as novidades e atualiza a base local de forma atômica e reativa sem congelar a tela.
3. **Given** que a conexão com a internet oscila ou é interrompida durante a transferência de dados, **When** ocorre a falha de rede, **Then** o sistema preserva integralmente as alterações locais na fila, sem corrupção de dados, e reagenda a transmissão para a próxima oportunidade de conexão sem exibir alertas intrusivos na tela.

---

### User Story 4 - Indicador Visual de Status de Sincronização e Validação Temporal (Priority: P2)

Como operador no curral, desejo olhar para o cabeçalho do aplicativo e visualizar claramente o estado da sincronização (Sincronizado, Sincronizando, Pendente ou Offline), além de poder conferir na aba Ajustes o horário exato da última sincronização bem-sucedida e receber alertas caso a data e hora do meu celular estejam desreguladas.

**Why this priority**: A transparência visual transmite confiança ao produtor de que suas informações estão protegidas, e a validação do relógio impede distorções em cálculos zootécnicos sensíveis ao tempo (como retorno de cio aos 21 dias e previsão de parto aos 282 dias).

**Independent Test**: Pode ser testado alternando os estados de rede e fila de mutações e observando se o cabeçalho e a aba Ajustes refletem com precisão cada estado (verde quando sincronizado, azul quando sincronizando, amarelo/azul discreto quando pendente, e cinza quando offline), incluindo alerta quando a data do aparelho estiver desajustada.

**Acceptance Scenarios**:

1. **Given** que todas as alterações locais já foram confirmadas na nuvem, **When** o usuário consulta o cabeçalho do aplicativo, **Then** o sistema apresenta o indicador visual verde "Sincronizado".
2. **Given** que há registros salvos no aparelho aguardando transmissão, **When** o usuário observa o cabeçalho ou os cartões de registro, **Then** o sistema exibe o indicador "Pendente de envio" acompanhado da contagem de registros aguardando conexão.
3. **Given** que o dispositivo está totalmente desconectado da internet, **When** o aplicativo detecta a ausência de sinal, **Then** o sistema apresenta o indicador neutro "Modo Offline", mantendo todas as telas de manejo desbloqueadas.
4. **Given** que o relógio interno do dispositivo apresenta diferença expressiva (superior a 5 minutos) em relação ao horário de referência da nuvem, **When** a sincronização é verificada, **Then** o sistema exibe um alerta orientando o usuário a corrigir a hora do aparelho para evitar incongruências nos cálculos reprodutivos.

---

### User Story 5 - Detecção de Conflitos e Tratamento Inteligente de Brinco Duplicado (Priority: P2)

Como gestor do rebanho, desejo que eventuais alterações concorrentes no mesmo registro feitas simultaneamente em aparelhos diferentes sejam resolvidas pela alteração mais recente (Last-Write-Wins), e que caso dois operadores cadastrem animais distintos com o mesmo número de brinco enquanto ambos operavam offline, o sistema mantenha ambos os registros salvos e sinalize o conflito na tela para resolução informada.

**Why this priority**: No manejo zootécnico diário, duplicidade acidental de brincos durante vacinações ou partos simultâneos é uma falha operacional humana real que não pode ocasionar a exclusão silenciosa ou a perda de dados de nenhum animal.

**Independent Test**: Pode ser testado cadastrando dois animais distintos com o mesmo número de brinco em dois aparelhos desconectados e verificando se, após a sincronização de ambos com a nuvem, ambos os animais continuam listados no rebanho com uma etiqueta clara de "Conflito de Brinco" orientando o usuário a alterar o brinco duplicado.

**Acceptance Scenarios**:

1. **Given** que o mesmo animal teve atributos distintos alterados em aparelhos diferentes durante o período offline, **When** ambos os aparelhos concluem a sincronização, **Then** a versão com carimbo de alteração mais recente prevalece de forma consistente em todos os dispositivos.
2. **Given** que dois operadores cadastraram animais diferentes utilizando o mesmo número de brinco enquanto operavam sem sinal, **When** ambos os dispositivos sincronizam com a nuvem, **Then** o sistema preserva os dois registros no rebanho e marca ambos com um alerta visível de "Conflito de Brinco" para correção pelo produtor.

---

### User Story 6 - Restauração Inicial em Novo Aparelho com Progresso Visual (Priority: P3)

Como produtor que adquiriu um celular novo ou disponibilizou um dispositivo para um novo funcionário, desejo entrar com minha conta e visualizar o progresso do download de todo o histórico da fazenda (animais, genealogia, coberturas, pesagens e parâmetros) antes de me deslocar para o curral sem sinal.

**Why this priority**: Bases com histórico de anos de manejo contêm centenas de animais e milhares de registros; o operador precisa ter a garantia visual de que a base local está completa e pronta para uso offline autônomo.

**Independent Test**: Pode ser testado instalando o aplicativo em um novo aparelho, realizando o login com uma conta com rebanho já cadastrado e confirmando a exibição da tela de progresso inicial até a liberação completa do painel da fazenda.

**Acceptance Scenarios**:

1. **Given** que o usuário conecta sua conta em um dispositivo recém-instalado sem base local, **When** a carga inicial é acionada, **Then** o sistema apresenta tela informativa com barra de progresso e contadores parciais das entidades sendo transferidas (animais, touros, coberturas, pesagens).
2. **Given** que o download de todos os registros é concluído com sucesso, **When** a carga é finalizada, **Then** o sistema disponibiliza imediatamente a navegação completa pelas abas e exibe confirmação de que o aplicativo está pronto para operar offline no campo.
3. **Given** que a conexão falha durante a carga inicial, **When** o usuário toca em "Tentar Novamente" ou a rede se restabelece, **Then** o sistema retoma o processo do ponto em que parou sem reiniciar a transferência dos dados já recebidos.

---

### Edge Cases

- **Solicitações sucessivas de código OTP**: Se o usuário tocar repetidamente no botão de solicitar código, o sistema deve respeitar o tempo mínimo de espera de 60 segundos entre envios sucessivos, exibindo a contagem regressiva restante sem sobrecarregar a comunicação.
- **Falha de rede no meio da transmissão de um lote de outbox**: Se a conexão for cortada exatamente no meio do envio de um lote, a operação de sincronização deve ser idempotente; nenhuma mutação local é descartada e o reenvio não deve duplicar registros no servidor.
- **Permanência de sessão em longos períodos offline**: Se o usuário passar semanas no curral sem qualquer sinal de rede, a sessão local deve permanecer ativa e válida, nunca exigindo login forçado ou bloqueando o acesso aos dados locais.
- **Desconexão voluntária da conta (Logout)**: Caso o usuário decida desconectar sua conta na aba Ajustes, o sistema deve solicitar confirmação explícita, esclarecendo o destino dos dados locais atuais e pausando as rotinas de sincronização.
- **Mutações geradas antes do primeiro login**: Todos os registros efetuados no modo inicial sem conta devem ser incorporados de forma transparente à fazenda do usuário assim que o primeiro login for realizado, sem perda de dados ou necessidade de recadastro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE garantir a operação completa e autônoma de todas as rotinas de manejo do rebanho em modo local offline, sem exigir login ou conectividade prévia com a internet ("Acesso Imediato no Curral").
- **FR-002**: O sistema DEVE disponibilizar autenticação por e-mail baseada em código de uso único (OTP) de 6 dígitos, dispensando criação ou memorização de senhas estáticas.
- **FR-003**: O sistema DEVE impor um intervalo de espera de segurança de no mínimo 60 segundos entre solicitações consecutivas de código OTP para o mesmo e-mail.
- **FR-004**: O sistema DEVE persistir a sessão do usuário de forma criptografada e segura no dispositivo, mantendo a autenticação ativa mesmo após reinicializações do aparelho ou longos períodos sem conexão.
- **FR-005**: O sistema DEVE criar automaticamente o registro da fazenda na nuvem e atribuir o usuário autenticado como proprietário no primeiro acesso de uma nova conta.
- **FR-006**: O sistema DEVE associar automaticamente todos os dados pré-existentes criados localmente no aparelho à fazenda vinculada no momento da autenticação.
- **FR-007**: O sistema DEVE realizar o envio automático e em lotes de todas as mutações locais pendentes (animais, touros, inseminações, pesagens, alertas e configurações) para a nuvem sempre que houver conectividade.
- **FR-008**: O envio de dados pendentes DEVE ser estritamente idempotente por identificador de operação (`operation_id`), prevenindo a criação de registros duplicados em caso de retransmissão de lotes.
- **FR-009**: O sistema DEVE realizar a busca e o download incremental de alterações remotas da fazenda com base no carimbo temporal da última sincronização bem-sucedida.
- **FR-010**: O sistema DEVE disparar a rotina de sincronização automaticamente ao abrir o aplicativo, ao retornar do segundo plano para o primeiro plano, ao restabelecer conexão de rede e com tempo de debounce após a gravação de novos dados.
- **FR-011**: O sistema DEVE exibir permanentemente no cabeçalho o estado atual da sincronização (Sincronizado, Sincronizando, Pendente de Envio, Modo Offline).
- **FR-012**: O sistema DEVE exibir na aba de Ajustes a data, hora e status da última sincronização concluída com sucesso, permitindo o acionamento de sincronização manual sob demanda.
- **FR-013**: O sistema DEVE verificar e alertar o usuário caso o relógio interno do dispositivo apresente divergência significativa (superior a 5 minutos) em relação ao horário de referência da nuvem.
- **FR-014**: O sistema DEVE resolver divergências simultâneas no mesmo registro aplicando a estratégia determinística da alteração mais recente (Last-Write-Wins baseada no carimbo de atualização UTC).
- **FR-015**: O sistema DEVE detectar duplicidade de numeração de brinco originada de cadastros offline simultâneos, preservando ambos os registros e marcando-os como pendentes de resolução zootécnica pelo usuário.
- **FR-016**: O sistema DEVE exibir tela de carregamento com indicador de progresso percentual e contadores de entidades durante a primeira carga de dados em um aparelho novo.
- **FR-017**: O sistema DEVE permitir a desconexão voluntária da conta na aba de Ajustes mediante confirmação explícita de segurança.

### Key Entities *(include if feature involves data)*

- **UserAccount**: Representa a identidade do produtor ou colaborador rural. Atributos conceituais: identificador único, endereço de e-mail e data de criação.
- **FarmTenancy**: Representa a propriedade rural vinculada ao usuário na nuvem. Atributos conceituais: identificador único (`farm_id`), identificador do proprietário (`owner_user_id`), nome da fazenda e data de vinculação.
- **SyncBatchQueue**: Representa o lote ordenado de mutações zootécnicas locais pendentes de envio. Atributos conceituais: identificador da operação (`operation_id`), entidade afetada, tipo de mutação (criação, atualização, exclusão lógica), payload da alteração, carimbo temporal local e status de envio.
- **SyncCheckpoint**: Representa o marcador de controle do último ciclo de sincronização bidirecional concluído. Atributos conceituais: `farm_id`, data/hora de referência remota (`server_updated_at`), status de conclusão e contador de registros processados.
- **EarTagConflictAlert**: Representa a detecção zootécnica de animais distintos portando o mesmo número de brinco após sincronização concorrente. Atributos conceituais: identificador do alerta, identificadores dos animais envolvidos, número do brinco duplicado, data de identificação e status de resolução.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue abrir o aplicativo e registrar um manejo reprodutivo em menos de 5 segundos no primeiro uso sem passar por telas obrigatórias de cadastro ou login.
- **SC-002**: O processo de login via código de 6 dígitos (OTP) é concluído em menos de 30 segundos a partir do recebimento do e-mail de verificação.
- **SC-003**: 100% dos dados registrados em modo offline são preservados e sincronizados com a nuvem sem perdas após a reconexão com a internet.
- **SC-004**: O reenvio de lotes de sincronização em caso de instabilidade de rede resulta em 0% de registros duplicados tanto localmente quanto na nuvem.
- **SC-005**: O indicador visual de sincronização no cabeçalho reflete alterações no estado da rede ou da fila de envio em menos de 1 segundo.
- **SC-006**: Em uma fazenda de porte médio com até 500 animais e 2.000 manejos, a restauração inicial completa em um dispositivo novo é finalizada em menos de 15 segundos em conexão móvel padrão ou Wi-Fi.
- **SC-007**: 100% dos conflitos de brinco duplicado entre aparelhos são sinalizados visualmente ao usuário sem exclusão silenciosa de nenhum animal.

## Assumptions

- O usuário possui acesso a uma conta de e-mail para receber o código OTP no momento da ativação da conta.
- O dispositivo móvel dispõe de conexão com a internet no momento em que o usuário opta por realizar o login e durante a carga inicial em aparelho novo.
- A nuvem utiliza modelo relacional isolado por fazenda via políticas de segurança de dados em nível de linha (Row Level Security), impedindo vazamento de dados entre fazendas diferentes.
- As tarefas de sincronização em segundo plano no dispositivo móvel respeitam as restrições nativas do sistema operacional para economia de energia e dados móveis.
- O aplicativo continua perfeitamente utilizável e autônomo para produtores que decidirem não conectar uma conta em nuvem.
