# Feature Specification: 005-ajustes-e-backup

**Feature Branch**: `005-ajustes-e-backup`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "005-ajustes-e-backup: Ajustes da Fazenda, Parâmetros Zootécnicos, Exportação CSV (Rebanho e Bezerras), Backup Offline JSON com Compartilhamento WhatsApp e Restauração Local"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exportação de Planilhas CSV do Rebanho e Bezerras (Priority: P1)

Como produtor de leite ou consultor técnico, desejo exportar os dados do rebanho e das bezerras em planilhas formatadas (.csv) para abrir no Excel ou compartilhar com técnicos e veterinários por mensagem, garantindo que os relatórios de manejo reprodutivo e de recria possam ser analisados fora do dispositivo móvel.

**Why this priority**: Planilhas são a ferramenta mais universalmente utilizada por veterinários, agrônomos e gestores rurais para cruzar dados produtivos, emitir diagnósticos e auditar índices zootécnicos da fazenda.

**Independent Test**: Pode ser testado gerando o arquivo CSV de rebanho e o CSV de bezerras a partir de uma base com animais cadastrados, abrindo o seletor nativo de compartilhamento do dispositivo e verificando se os dados exportados abrem corretamente com acentuação e colunas íntegras em programas de planilha.

**Acceptance Scenarios**:

1. **Given** que a fazenda possui vacas e novilhas com histórico reprodutivo registrado, **When** o usuário aciona a opção "CSV Rebanho", **Then** o sistema gera um arquivo tabular contendo colunas de identificação (brinco, nome, categoria, status reprodutivo, dias em aberto, data da última inseminação, touro utilizado, status do diagnóstico de gestação e previsão de parto/secagem) e abre o diálogo de compartilhamento do sistema operacional.
2. **Given** que a fazenda possui bezerras com pesagens e genealogia cadastradas, **When** o usuário aciona a opção "CSV Bezerras", **Then** o sistema gera um arquivo tabular contendo colunas de identificação da bezerra, data de nascimento, peso ao nascer, identificação da mãe, pai e avó materna, lote/fase atual, histórico de pesagens com Ganho Médio Diário (GMD) e meta de peso para a 1ª inseminação, abrindo o diálogo de compartilhamento do sistema operacional.
3. **Given** que o arquivo CSV é gerado em português com caracteres especiais e acentos, **When** aberto no leitor de planilhas, **Then** todos os textos, números decimais e datas mantêm a formatação legível sem caracteres corrompidos.

---

### User Story 2 - Backup Seguro em 1 Toque para WhatsApp e Área de Transferência (Priority: P1)

Como produtor rural operando em modo offline, desejo gerar um arquivo consolidado de backup dos dados da minha fazenda em formato seguro (.json) e enviá-lo via WhatsApp ou copiar para a área de transferência com um único toque, para assegurar que meus dados nunca sejam perdidos mesmo em caso de avaria, perda ou troca de celular.

**Why this priority**: Em uma arquitetura offline-first sem dependência inicial de nuvem, o backup local exportável para o canal de comunicação mais comum do campo (WhatsApp) é a principal salvaguarda contra perda irreversível de dados.

**Independent Test**: Pode ser testado clicando em "Exportar Backup para WhatsApp", selecionando um contato no WhatsApp para envio do arquivo e verificando se o payload contém a estrutura completa de todas as entidades locais acompanhada de data/hora de geração e identificador da fazenda.

**Acceptance Scenarios**:

1. **Given** que existem animais, inseminações, pesagens, touros e parâmetros cadastrados, **When** o usuário toca no botão "Exportar Backup para WhatsApp (JSON)", **Then** o sistema compila todas as tabelas locais em um arquivo estruturado único com metadados de versão e integridade, e dispara a folha de compartilhamento nativa permitindo o envio direto por aplicativos de mensagens ou armazenamento em disco.
2. **Given** que o usuário deseja colar o backup manualmente em uma mensagem ou documento, **When** o usuário solicita a cópia rápida do conteúdo, **Then** o sistema copia o payload textual do backup para a área de transferência do aparelho e exibe confirmação visual de sucesso.
3. **Given** que a geração do arquivo é concluída, **When** a ação é finalizada, **Then** o usuário recebe retorno tátil e visual de que o backup foi gerado com sucesso.

---

### User Story 3 - Restauração de Dados a Partir de Arquivo de Backup (Priority: P2)

Como produtor rural que trocou de celular ou precisou recuperar dados anteriores, desejo selecionar um arquivo de backup (.json) gerado previamente pelo ReproLeite para restaurar a base de dados da fazenda no aplicativo, restabelecendo a continuidade operacional do rebanho.

**Why this priority**: A exportação de segurança só atinge seu propósito completo se houver um mecanismo confiável e seguro para ler e reinserir esses dados no banco local sem corrupção ou inconsistência estrutural.

**Independent Test**: Pode ser testado realizando um backup, cadastrando um novo registro teste, acionando a restauração do arquivo de backup anterior e confirmando que o estado do banco retornou fielmente ao momento do backup com integridade referencial mantida.

**Acceptance Scenarios**:

1. **Given** que o usuário aciona a opção "Restaurar Dados de Arquivo JSON", **When** o fluxo é iniciado, **Then** o sistema exibe um aviso explícito de confirmação alertando que os dados locais atuais serão substituídos pelo conteúdo do arquivo de backup.
2. **Given** que o usuário confirma a ação e seleciona um arquivo de backup válido, **When** o arquivo é processado, **Then** o sistema valida o formato estrutural, substitui as informações em transação segura e atômica, e exibe notificação de restauração concluída com sucesso.
3. **Given** que o arquivo fornecido está corrompido, incompleto ou não pertence ao ReproLeite, **When** a validação de integridade falha, **Then** a restauração é abortada imediatamente sem modificar nenhuma informação do banco local e um alerta de erro amigável é apresentado ao usuário.

---

### User Story 4 - Visualização e Customização dos Parâmetros Zootécnicos da Fazenda (Priority: P3)

Como gestor da fazenda, desejo visualizar e editar os parâmetros zootécnicos e prazos de manejo reprodutivo e de recria (janela de retorno de cio, dias para toque/palpação, duração média de gestação, período de secagem e metas de desmame/peso), para que as projeções e alertas do sistema se adaptem à raça do rebanho e ao protocolo veterinário da propriedade.

**Why this priority**: Cada fazenda ou raça leiteira (Holandês, Girolando, Jersey) possui metas específicas de dias em aberto, taxa de gestação e protocolos de toque que personalizam os cálculos do aplicativo.

**Independent Test**: Pode ser testado alterando o prazo de diagnóstico de toque de 45 para 35 dias e verificando se os cartões de alerta na rotina da fazenda e a tela de parâmetros refletem a nova configuração imediatamente.

**Acceptance Scenarios**:

1. **Given** que o usuário acessa a tela de Ajustes, **When** visualiza o cartão "Parâmetros da Fazenda", **Then** o sistema apresenta os valores atuais vigentes para janela de retorno de cio, diagnóstico de toque, duração da gestação e período de secagem pré-parto.
2. **Given** que o usuário aciona "Editar Metas e Prazos", **When** modifica um ou mais prazos com valores numéricos válidos e confirma, **Then** os novos parâmetros são salvos de forma persistente e passam a reger os cálculos subsequentes de previsões e alertas.
3. **Given** que o usuário insere valores absurdos ou inválidos (como prazos negativos ou gestação de 0 dias), **When** tenta salvar, **Then** o sistema impede a persistência e exibe mensagem de validação orientando os limites aceitáveis.

---

### Edge Cases

- **Exportação com base vazia**: Ao solicitar a exportação de CSV ou JSON com zero animais ou bezerras cadastradas, o sistema gera o arquivo estruturado contendo os cabeçalhos das colunas e exibe um aviso informativo ao usuário informando que não há registros preenchidos, sem travar nem gerar arquivos nulos.
- **Caracteres especiais e acentuação no CSV**: Nomes de vacas, observações e números de brinco com caracteres acentuados (ex.: "Coração", "Estrela d'Água") devem ser codificados em UTF-8 com suporte nativo a planilhas (BOM), prevenindo desconfiguração visual ao abrir no Microsoft Excel.
- **Falha ou interrupção durante a restauração do backup**: Caso o aplicativo seja fechado ou sofra encerramento forçado durante o processo de restauração, a operação deve ser tratada em transação atômica única, assegurando que o banco não permaneça em estado corrompido ou parcialmente preenchido.
- **Arquivo de backup adulterado ou com schema incompatível**: Se um usuário tentar carregar um arquivo JSON arbitrário ou de versão não suportada, o sistema deve recusar a importação antes de qualquer escrita no banco de dados, reportando o motivo específico da incompatibilidade.
- **Ausência de aplicativos de compartilhamento compatíveis**: Em dispositivos que não possuam clientes de e-mail ou WhatsApp instalados, o sistema deve disponibilizar opções nativas alternativas como salvar em pastas locais de arquivos ou copiar para a área de transferência.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir a exportação dos dados do rebanho em formato tabular CSV, incluindo identificadores, status produtivo/reprodutivo e datas de cobertura, toque e parto.
- **FR-002**: O sistema DEVE permitir a exportação dos dados de bezerras em formato tabular CSV, incluindo genealogia de 3 níveis, peso ao nascer, pesagens registradas e Ganho Médio Diário (GMD).
- **FR-003**: Os arquivos CSV gerados DEVEM incluir cabeçalho descritivo com nomes legíveis em português e formatação compatível com programas de planilhas usuais.
- **FR-004**: O sistema DEVE gerar arquivo de backup completo em formato JSON contendo a totalidade das entidades da fazenda ativa (animais, touros, inseminações, pesagens, alertas e parâmetros).
- **FR-005**: O arquivo de backup JSON DEVE incluir metadados de segurança contendo data e hora de geração (UTC), identificador da fazenda (`farm_id`) e versão do esquema de dados.
- **FR-006**: O sistema DEVE acionar o mecanismo nativo de compartilhamento do dispositivo para envio do arquivo de backup ou CSV diretamente via WhatsApp, e-mail ou aplicativos de arquivos.
- **FR-007**: O sistema DEVE fornecer mecanismo para copiar o conteúdo do backup diretamente para a área de transferência do dispositivo.
- **FR-008**: O sistema DEVE permitir a seleção e importação de arquivo JSON de backup para restauração da base de dados local.
- **FR-009**: O sistema DEVE exigir confirmação explícita do usuário antes de iniciar qualquer operação de restauração de backup que substitua os dados existentes.
- **FR-010**: O sistema DEVE validar a integridade estrutural e a compatibilidade do arquivo de backup antes de aplicar a restauração.
- **FR-011**: A restauração DEVE ser executada de maneira atômica, revertendo quaisquer alterações caso ocorra erro durante o processamento.
- **FR-012**: O sistema DEVE exibir os parâmetros zootécnicos vigentes da fazenda (janela de retorno de cio, prazo de diagnóstico de toque, duração da gestação e período de secagem).
- **FR-013**: O sistema DEVE permitir a alteração e persistência dos parâmetros zootécnicos da fazenda respeitando limites biológicos razoáveis.
- **FR-014**: Toda a rotina de exportação, backup, restauração e ajuste de parâmetros DEVE funcionar de forma 100% autônoma e offline, sem exigir conexão com a internet ou autenticação em nuvem.

### Key Entities *(include if feature involves data)*

- **BackupPayload**: Representa o pacote estruturado de dados exportados da fazenda. Atributos: `version` (versão do formato), `exported_at` (carimbo de data/hora ISO 8601), `farm_id` (identificador da fazenda), e coleções com as tabelas de negócio (`animals`, `inseminations`, `bulls`, `weighings`, `alerts`, `settings`).
- **FarmSettings**: Representa as configurações zootécnicas e metas produtivas da fazenda. Atributos: `farm_id`, `heat_window_days` (padrão 21 dias), `pregnancy_check_days` (padrão 45 dias), `gestation_days` (padrão 282 dias), `dry_off_days` (padrão 60 dias antes do parto), metas de peso de recria e tabela de aleitamento.
- **CSVExportRecord**: Representação textual normalizada de registros do rebanho e de bezerras pronta para ser formatada em delimitadores padrão e salva em arquivo com codificação adequada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue exportar e acionar o compartilhamento do arquivo CSV ou JSON de backup em menos de 3 toques na tela a partir da aba Ajustes.
- **SC-002**: A geração do arquivo de backup completo para uma fazenda típica (até 500 animais e 2.000 manejos) é concluída em menos de 2 segundos.
- **SC-003**: 100% dos backups válidos gerados pelo aplicativo podem ser restaurados com restauração exata e sem perda de integridade das relações genealógicas e reprodutivas.
- **SC-004**: 100% das tentativas de restauração com arquivos corrompidos ou schemas incompatíveis são bloqueadas sem adulterar a base de dados em operação.
- **SC-005**: Os arquivos CSV exportados abrem diretamente no Microsoft Excel e Google Planilhas sem desconfiguração de caracteres acentuados em 100% dos testes de conformidade.
- **SC-006**: Todas as ações de exportação, compartilhamento, cópia e restauração operam com taxa de sucesso de 100% mesmo em modo avião (sem conectividade celular ou Wi-Fi).

## Assumptions

- O dispositivo do usuário dispõe de espaço de armazenamento local suficiente para gerar os arquivos temporários de exportação.
- O aplicativo utiliza os utilitários de compartilhamento e sistema de arquivos disponibilizados pelo sistema operacional móvel.
- Para o compartilhamento direto via WhatsApp, assume-se que o usuário possua o aplicativo do WhatsApp ou similar instalado no aparelho; caso contrário, as opções nativas gerais do sistema de arquivos e a cópia para a área de transferência cobrem a necessidade.
- A sincronização automática com banco de dados em nuvem (Supabase) e autenticação de usuários são tratadas na Feature 006, permanecendo a Feature 005 estritamente voltada a mecanismos locais e offline de segurança de dados.
