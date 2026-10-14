# Feature Specification: Fundação Offline & Cabeçalho de Manejo com Simulador Temporal e Proteção de Dados

**Feature Branch**: `000-fundacao-offline`

**Created**: 2026-10-13

**Status**: Ready for Planning

**Input**: User description: "000-fundacao-offline: Infraestrutura Core, Banco Local, Design System, Topo com Indicador de Sync e Simulador de Tempo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operação Confiável em Modo Curral (Offline por Padrão) (Priority: P1)

Como produtor rural ou vaqueiro trabalhando no curral, bezerreiro ou piquetes sem sinal de celular ou internet, quero utilizar o aplicativo normalmente para registrar e consultar animais e manejos sem travamentos, atrasos ou avisos de erro de rede, para que o trabalho de campo nunca seja interrompido por falta de conectividade.

**Why this priority**: É o valor fundamental do produto. Se o aplicativo falhar ou bloquear quando o usuário estiver sem internet no curral, todo o sistema perde a utilidade prática no campo.

**Independent Test**: Pode ser testado ativando o modo avião no dispositivo e realizando navegação, consultas e cadastros locais; todos os dados devem persistir e permanecer íntegros após fechar e reabrir o aplicativo.

**Acceptance Scenarios**:

1. **Given** que o dispositivo está totalmente desconectado da internet (modo avião), **When** o usuário abre o aplicativo e realiza operações de leitura ou gravação, **Then** o aplicativo responde imediatamente sem exibir bloqueios, travamentos ou erros de rede.
2. **Given** que o aplicativo foi utilizado sem internet, **When** o usuário fecha e reabre o aplicativo, **Then** todos os dados previamente registrados permanecem intactos e disponíveis para consulta.

---

### User Story 2 - Simulação Temporal da Data de Manejo no Cabeçalho (Priority: P1)

Como gestor da fazenda, quero visualizar e alterar rapidamente a data de trabalho ativa através do cabeçalho do aplicativo (avançando +1 dia, +7 dias ou +21 dias), para que eu possa simular o avanço do tempo e verificar na prática quais alertas de cio, toques veterinários e cortes de leite estarão programados para os próximos dias.

**Why this priority**: A tomada de decisão zootécnica depende de antecipar eventos. O simulador temporal permite testar e planejar as semanas seguintes com facilidade, além de ser essencial para demonstrações e testes em campo.

**Independent Test**: Pode ser testado tocando no cabeçalho na data atual, acionando o atalho de `+21 dias` e conferindo se a data de referência é recalculada globalmente em toda a interface.

**Acceptance Scenarios**:

1. **Given** que o aplicativo está exibindo a data atual real, **When** o usuário toca no atalho `+21 dias (Cio)`, **Then** a data de manejo do sistema avança exatamente 21 dias e todos os quadros diários atualizam seus cálculos para essa nova data.
2. **Given** que o usuário está navegando com uma data futura simulada, **When** ele toca no atalho `Resetar para Hoje`, **Then** o sistema retorna imediatamente para a data real do calendário.
3. **Given** que o usuário precisa simular um dia específico, **When** ele seleciona uma data no calendário do cabeçalho, **Then** o sistema adota essa data como a referência ativa de todas as telas.

---

### User Story 3 - Visibilidade da Proteção dos Dados e Estado de Sincronização (Priority: P2)

Como usuário do aplicativo, quero visualizar de forma clara e permanente no topo da tela o estado de segurança e proteção dos meus dados (se estão salvos apenas no aparelho ou já replicados na nuvem), com a opção de forçar uma sincronização manual ou alternar para modo offline simulado para validar o comportamento do sistema.

**Why this priority**: O produtor rural precisa ter certeza psicológica de que seus dados não serão perdidos caso o aparelho quebre. A transparência do indicador reduz a ansiedade de perda de dados.

**Independent Test**: Pode ser testado gerando uma alteração local e observando o indicador mudar para o estado pendente (amarelo) com o contador correto, e voltando a protegido (verde) após a conclusão do envio.

**Acceptance Scenarios**:

1. **Given** que todos os dados locais já foram confirmados e replicados na nuvem, **When** o usuário observa o cabeçalho, **Then** um selo verde indica "Nuvem Protegida · Sincronizado agora" (ou há X tempo).
2. **Given** que o usuário realizou 3 alterações locais sem internet, **When** ele olha o cabeçalho, **Then** um selo amarelo indica "3 alterações pendentes de envio (Modo Curral Offline)".
3. **Given** que há alterações pendentes e o dispositivo possui conexão, **When** o usuário toca no botão "Sincronizar Agora", **Then** o indicador exibe o estado azul "Sincronizando..." e em seguida retorna ao estado verde protegido.
4. **Given** que o usuário deseja testar o comportamento estritamente offline em ambiente conectado, **When** ele ativa o alternador "Simular: Sem Internet", **Then** o sistema bloqueia tentativas de rede externas e opera em modo curral simulado.

---

### User Story 4 - Ergonomia e Acessibilidade Sob Sol Forte (Priority: P2)

Como vaqueiro ou técnico manipulando o celular sob sol escaldante e com as mãos sujas ou enluvadas, quero botões grandes, textos de altíssimo contraste e entradas facilitadas, para que eu consiga ler e tocar nos botões sem errar o alvo.

**Why this priority**: Interfaces pensadas para escritório falham no curral. A ergonomia rural garante uso confortável e reduz drasticamente erros de toque sob sol forte.

**Independent Test**: Pode ser testado verificando que todos os botões de ação primária possuem área de toque generosa (mínimo de 56px de altura) e contraste visual nítido contra fundos claros.

**Acceptance Scenarios**:

1. **Given** que o usuário está sob iluminação natural intensa, **When** ele visualiza a tela, **Then** todos os textos e indicadores mantêm leitura nítida e contraste superior a 4.5:1 sem depender de modo escuro.
2. **Given** que o usuário tenta acionar o botão principal de uma ação, **When** ele toca na área do botão, **Then** o toque é reconhecido com precisão sem acionar elementos vizinhos devido ao espaçamento e altura mínima de 56px.

---

### Edge Cases

- O que acontece se o relógio do sistema operacional do celular estiver atrasado ou adiantado em relação ao tempo real? O sistema deve manter a coerência das ordens de modificação e exibir alerta caso a diferença com a data de rede seja excessiva.
- Como o sistema se comporta se a conexão cair no meio de uma sincronização? As alterações locais continuam preservadas na fila de pendências e o processo é retomado na próxima tentativa sem duplicar dados.
- O que acontece se o usuário avançar o simulador para uma data anterior a registros já criados? O sistema exibe os dados válidos para aquela data no passado sem corromper lançamentos futuros.
- Como o sistema trata registros excluídos por engano? O registro é ocultado da visualização diária, mas sua marcação de exclusão é preservada para que outros dispositivos saibam que ele foi removido.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir a execução de todas as consultas e registros de dados sem exigir conexão com a internet.
- **FR-002**: O sistema DEVE exibir um cabeçalho persistente no topo de todas as telas principais contendo a data de manejo ativa e o indicador de segurança dos dados.
- **FR-003**: O sistema DEVE disponibilizar atalhos rápidos de navegação temporal no cabeçalho (+1 dia, +7 dias, +21 dias e resetar para data real).
- **FR-004**: O sistema DEVE recalcular todos os prazos, contagens diárias e resumos zootécnicos tomando como base a data de manejo atualmente ativa no cabeçalho.
- **FR-005**: O sistema DEVE apresentar um indicador visual dinâmico com três estados de sincronização: Protegido/Sincronizado (verde), Alterações Pendentes (amarelo com contador de registros) e Sincronizando (azul).
- **FR-006**: O sistema DEVE fornecer um botão "Sincronizar Agora" acessível no topo para acionamento manual do envio e recebimento de dados quando houver rede.
- **FR-007**: O sistema DEVE fornecer um alternador de "Modo Curral Simulado" (com/sem internet) para viabilizar testes e validações em campo.
- **FR-008**: O sistema DEVE atribuir um identificador único universal (UUID v4) gerado localmente para cada registro comercial criado no aparelho.
- **FR-009**: O sistema DEVE registrar carimbos de data/hora de criação e de última modificação para todas as entidades.
- **FR-010**: O sistema DEVE resolver conflitos de alteração concorrente entre múltiplos aparelhos utilizando uma política determinística onde a modificação mais recente prevalece.
- **FR-011**: O sistema DEVE aplicar exclusão segura (soft delete), preservando a data de remoção do registro para evitar quebras em árvores genealógicas e propagar a deleção a outros aparelhos.
- **FR-012**: O sistema DEVE garantir que os botões de ação primária tenham altura mínima de 56px e contraste visual adaptado para uso sob luz solar direta.

### Key Entities *(include if feature involves data)*

- **DataDeManejo**: Representa a data de referência operacional adotada pelo usuário no momento da navegação (padrão: data atual do calendário; ajustável via simulador ou atalhos rápidos).
- **EstadoSincronizacao**: Representa a condição de proteção dos dados locais (status de conexão, contagem de registros pendentes de envio, momento da última sincronização bem-sucedida e sinalizador de modo curral simulado).
- **ParametrosFazenda**: Representa os dados e identificadores da propriedade rural ativa (identificador universal da fazenda, parâmetros de visualização e regras locais).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos fluxos de navegação e registro de dados funcionam em modo avião sem mensagens de erro de rede ou travamentos.
- **SC-002**: A alternância da data de manejo no simulador recalcula e atualiza as informações da tela em menos de 500 milissegundos.
- **SC-003**: O contador de alterações pendentes de envio é atualizado em até 1 segundo após qualquer criação, edição ou exclusão de registro no dispositivo.
- **SC-004**: Usuários operando em ambiente externo com luvas ou mãos molhadas conseguem acionar botões primários sem toques acidentais em elementos vizinhos.
- **SC-005**: Zero perda ou duplicidade de dados locais ao alternar reiteradas vezes entre conexão ativa e modo curral offline.

## Assumptions

- O aplicativo é distribuído como aplicativo móvel nativo, com armazenamento seguro local isolado das restrições de navegadores web.
- Cada fazenda possui seu próprio identificador universal, permitindo a separação estrita de dados mesmo que múltiplos técnicos compartilhem o mesmo dispositivo ou sincronizem com a nuvem.
- O formato padrão das datas de manejo nas regras de negócio segue o padrão de calendário `YYYY-MM-DD` sem componentes de fuso horário, prevenindo deslocamentos indevidos de dias ao calcular prazos zootécnicos.
