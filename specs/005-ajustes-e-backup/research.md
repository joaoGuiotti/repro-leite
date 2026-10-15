# Research: 005-ajustes-e-backup

**Feature**: `005-ajustes-e-backup`  
**Date**: 2026-10-15  
**Context**: Implementação de exportação tabular CSV (Rebanho e Bezerras), backup e restauração local JSON com compartilhamento WhatsApp/sistema operacional e edição de parâmetros zootécnicos da fazenda.

---

## 1. Bibliotecas Nativas de Arquivos, Compartilhamento e Área de Transferência

### Decision
Adotar as bibliotecas oficiais do ecossistema Expo SDK 57:
1. `expo-file-system`: para manipulação e escrita de arquivos temporários (`FileSystem.cacheDirectory`) de exportação (.csv e .json) e leitura de arquivos locais.
2. `expo-sharing`: para acionar a folha de compartilhamento nativa do sistema operacional (`Sharing.shareAsync`), permitindo envio direto para WhatsApp, salvamento no Google Drive/Arquivos ou envio por e-mail.
3. `expo-clipboard`: para cópia instantânea de payloads textuais (JSON compacto) para a área de transferência do dispositivo.
4. `expo-document-picker`: para seleção intuitiva e segura de arquivos `.json` de backup salvos no aparelho durante o fluxo de restauração.

### Rationale
- Compatibilidade nativa total com Continuous Native Generation (CNG) e Expo Go / Development Builds sem necessidade de código nativo customizado em `ios/` ou `android/`.
- `Sharing.isAvailableAsync()` permite verificar a disponibilidade da API antes de acionar a folha de compartilhamento, oferecendo fallback amigável quando executado em navegadores desktop ou ambientes restritos.
- Instalação via `npx expo install` garante pinning exato de versões alinhadas ao Expo SDK 57.

### Alternatives Considered
- `react-native-share` / `react-native-fs`: Requerem compilação nativa dedicada, incompatíveis com Expo Managed sem prebuild específico e propensos a divergência de versões entre iOS e Android.
- `react-native-blob-util`: Complexidade excessiva para manipulação simples de arquivos JSON e CSV locais.

---

## 2. Formatação Tabular CSV e Compatibilidade com Microsoft Excel / Google Planilhas

### Decision
- **Codificação**: UTF-8 com Byte Order Mark (`\uFEFF` no início do arquivo).
- **Separador de Colunas**: Ponto e vírgula (`;`), que é o padrão regional brasileiro (`pt-BR`) adotado automaticamente pelo Microsoft Excel no Windows/Mac sem necessidade de assistente de importação.
- **Escape de Caracteres**: Campos de texto que contenham ponto e vírgula, aspas duplas ou quebras de linha são delimitados por aspas duplas, com aspas internas duplicadas (`""`) de acordo com a RFC 4180.
- **Formatação de Datas**: `DD/MM/AAAA` nas planilhas para leitura humana direta pelo produtor e técnicos de campo, preservando os campos vazios com traço `-`.
- **Formatação de Decimais**: Vírgula como separador decimal (ex.: `38,5 kg`, `0,850 kg/dia`) condizente com a localização brasileira.

### Rationale
- No Brasil, o Excel interpreta vírgula como separador decimal e falha ao separar colunas por vírgula em arquivos CSV. O uso de `;` combinado com `\uFEFF` garante que o produtor abra a planilha diretamente ao tocar no arquivo no WhatsApp sem colunas mescladas ou caracteres estranhos como "Corao".

### Alternatives Considered
- CSV padrão americano com vírgula (`,`): Provoca colunas quebradas ou misturadas quando aberto por produtores brasileiros no Microsoft Excel padrão.
- Geração de arquivos `.xlsx` nativos via `sheetjs` / `xlsx`: Adiciona mais de 1MB ao bundle do app, alta complexidade e risco de quebra de licenças ou vulnerabilidades.

---

## 3. Estrutura e Validação do Payload de Backup JSON

### Decision
Definir um envelope de backup com cabeçalho de metadados e versionamento explícito:
```json
{
  "version": 1,
  "app": "repro-leite",
  "farm_id": "uuid-da-fazenda",
  "exported_at": "2026-10-15T13:45:00.000Z",
  "summary": {
    "animals_count": 120,
    "inseminations_count": 340,
    "bulls_count": 15,
    "weighings_count": 450,
    "settings_count": 6
  },
  "data": {
    "settings": [...],
    "bulls": [...],
    "animals": [...],
    "inseminations": [...],
    "weighings": [...],
    "alerts": [...]
  }
}
```

### Rationale
- O envelope permite validação em tempo constante ($O(1)$) da versão e aplicação antes de qualquer processamento pesado.
- O sumário (`summary`) permite exibir para o usuário um modal de pré-visualização claro: *"Este backup contém 120 animais e 340 inseminações gerado em 15/10/2026. Deseja prosseguir?"*.
- O versionamento (`version: 1`) viabiliza migrações transparentes caso novas tabelas sejam adicionadas no futuro.

### Alternatives Considered
- Dump bruto do banco em arquivo `.sqlite` binário: Frágil entre versões do SQLite/Drizzle, risco de travar por locks de arquivos abertos e ilegível para inspeção do usuário.
- Array plano sem metadados: Impossibilita validar se o arquivo pertence ao ReproLeite ou a outro aplicativo antes de tentar restaurar.

---

## 4. Estratégia de Restauração Transacional Segura (Disaster Recovery)

### Decision
1. **Validação Estrutural Prévia**: Validar campos de metadados e presença das coleções em `data`. Se inválido, abortar antes de qualquer escrita no banco e exibir erro descritivo.
2. **Confirmação do Usuário**: Modal com aviso enfático de substituição dos dados da fazenda com opções explícitas "Cancelar" e "Confirmar e Substituir".
3. **Transação Atômica**:
   - Abrir transação exclusiva via Drizzle/SQLite `db.transaction()`.
   - Limpar registros pertencentes ao `farm_id` nas tabelas filhas primeiro (respeitando chaves estrangeiras: `alerts`, `weighings`, `inseminations`, depois `animals`, `bulls`, `settings`).
   - Inserir os registros do backup em lote nas tabelas pai (`settings`, `bulls`, `animals`) e depois nas tabelas dependentes (`inseminations`, `weighings`, `alerts`).
   - Se ocorrer qualquer exceção em qualquer tabela, disparar `rollback` imediato, restaurando o estado original integralmente.
4. **Atualização de Estado Global**: Invalidar caches e disparar recarregamento das queries ativas.

### Rationale
- Previne estados intermediários ou corrompidos em caso de bateria descarregada ou encerramento do app durante a restauração.

---

## 5. Edição e Persistência de Parâmetros Zootécnicos

### Decision
- Criar o componente modal `EditSettingsModal` conectado a `useSettings`.
- Parâmetros editáveis com validações de sanidade biológica:
  - Janela de Retorno de Cio: 18 a 26 dias (padrão 21)
  - Diagnóstico de Toque / Palpação: 28 a 90 dias (padrão 45)
  - Duração da Gestação: 270 a 295 dias (padrão 282)
  - Período de Secagem Pré-Parto: 30 a 90 dias (padrão 60)
  - Meta de Peso para 1ª IA de Novilhas: 300 a 450 kg (padrão 360)
- Os valores são salvos na tabela `settings` via `updateUseCase` já existente no domínio e refletem automaticamente nos cálculos da aplicação.

### Rationale
- Permite que fazendas com protocolos específicos (ex.: ultrassonografia aos 30 dias em vez de toque aos 45 dias, ou raças zebuínas/cruzadas com gestações de durações distintas) adaptem a inteligência zootécnica do ReproLeite sem alterar o código-fonte.
