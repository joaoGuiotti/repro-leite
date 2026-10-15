# Data Model: 005-ajustes-e-backup

**Feature**: `005-ajustes-e-backup`  
**Date**: 2026-10-15  
**Context**: Esquema de dados para envelopes de backup/restauração JSON, modelos de exportação tabular CSV e parametrização zootécnica.

---

## 1. Envelope de Backup & Restauração JSON

O arquivo de backup gerado para compartilhamento (WhatsApp, Drive, Arquivos) e restauração possui a seguinte tipagem estrita:

```typescript
export interface BackupMetadata {
  version: number;             // Ex.: 1
  app: 'repro-leite';
  farm_id: string;             // UUID da fazenda
  exported_at: string;         // ISO 8601 UTC (ex: "2026-10-15T14:30:00.000Z")
  app_version?: string;        // Ex: "1.0.0"
}

export interface BackupSummary {
  animals_count: number;
  inseminations_count: number;
  bulls_count: number;
  weighings_count: number;
  settings_count: number;
}

export interface BackupPayload {
  metadata: BackupMetadata;
  summary: BackupSummary;
  data: {
    settings: BackupSettingRecord[];
    bulls: BackupBullRecord[];
    animals: BackupAnimalRecord[];
    inseminations: BackupInseminationRecord[];
    weighings: BackupWeighingRecord[];
    alerts: BackupAlertRecord[];
  };
}
```

### Registros das Entidades no Backup
- **BackupSettingRecord**: `{ id: string; farm_id: string; key: string; value: string; updated_at: string }`
- **BackupBullRecord**: `{ id: string; farm_id: string; name: string; code?: string; breed?: string; doses_available: number; created_at: string; updated_at: string; deleted_at?: string | null }`
- **BackupAnimalRecord**: `{ id: string; farm_id: string; ear_tag: string; name?: string; birth_date?: string; sex: 'female' | 'male'; mother_id?: string | null; father_id?: string | null; maternal_grandmother_name?: string | null; birth_weight_kg?: number | null; status: string; lactation_status: string; created_at: string; updated_at: string; deleted_at?: string | null }`
- **BackupInseminationRecord**: `{ id: string; farm_id: string; animal_id: string; bull_id: string; insemination_date: string; heat_window_start: string; heat_window_end: string; pregnancy_check_date: string; expected_calving_date: string; dry_off_date: string; status: string; pregnancy_result?: string | null; created_at: string; updated_at: string; deleted_at?: string | null }`
- **BackupWeighingRecord**: `{ id: string; farm_id: string; animal_id: string; weighing_date: string; weight_kg: number; notes?: string | null; created_at: string; updated_at: string; deleted_at?: string | null }`
- **BackupAlertRecord**: `{ id: string; farm_id: string; animal_id: string; alert_type: string; due_date: string; resolved: boolean; resolved_at?: string | null; created_at: string; updated_at: string }`

---

## 2. Modelos de Exportação Tabular CSV

### 2.1 Rebanho (`HerdExportRow`)
Estrutura mapeada para o arquivo `rebanho_export_[data].csv`:

| Coluna | Descrição | Exemplo de Valor |
| :--- | :--- | :--- |
| `BRINCO` | Identificação visual do animal | `104` |
| `NOME` | Nome de registro do animal | `Estrela` |
| `CATEGORIA` | Categoria zootécnica (Vaca / Novilha) | `Vaca em Lactação` |
| `STATUS_REPRODUTIVO` | Vazia, Inseminada, Prenhe, Seca | `Inseminada (Aguardando Toque)` |
| `DIAS_EM_ABERTO` | Dias decorridos desde o último parto sem nova gestação confirmada | `92` |
| `DATA_ULTIMA_IA` | Data da última cobertura (DD/MM/AAAA) | `12/09/2026` |
| `TOURO_IA` | Nome do touro da última inseminação | `Jaguar FIV` |
| `DATA_PREVISTA_CIO` | Marco de retorno de cio (21 dias) | `03/10/2026` |
| `DATA_PREVISTA_TOQUE` | Marco para exame de prenhez (45 dias) | `27/10/2026` |
| `DATA_PREVISTA_SECAGEM` | Secagem pré-parto (60 dias antes) | `15/04/2027` |
| `DATA_PREVISTA_PARTO` | Previsão de parto (282 dias) | `21/06/2027` |
| `OBSERVACOES` | Notas de manejo | `3ª lactação, casco tratado` |

### 2.2 Bezerras & Recria (`CalvesExportRow`)
Estrutura mapeada para o arquivo `bezerras_export_[data].csv`:

| Coluna | Descrição | Exemplo de Valor |
| :--- | :--- | :--- |
| `BRINCO` | Identificação visual da bezerra | `302` |
| `NOME` | Nome de registro | `Princesa` |
| `SEXO` | Fêmea ou Macho | `Fêmea` |
| `DATA_NASCIMENTO` | Data de nascimento (DD/MM/AAAA) | `05/08/2026` |
| `PESO_NASCIMENTO_KG` | Peso inicial ao nascer | `41,0` |
| `BRINCO_MAE` | Brinco da mãe cadastrada | `104` |
| `NOME_PAI` | Nome do touro (pai) | `Jaguar FIV` |
| `AVO_MATERNA` | Identificação da avó materna | `Boneca` |
| `FASE_ALEITAMENTO` | Fase atual da dieta líquida | `Fase de Pico (16 a 100 dias)` |
| `LEITE_DIARIO_LITROS` | Volume recomendado por dia | `8,0` |
| `ULTIMO_PESO_KG` | Peso na última aferição | `98,5` |
| `DATA_ULTIMA_PESAGEM` | Data da última aferição | `10/10/2026` |
| `GMD_G_DIA` | Ganho Médio Diário em gramas/dia | `870` |
| `META_PESO_1A_IA_KG` | Peso alvo para aptidão reprodutiva | `360,0` |
| `STATUS_META_IA` | Atingiu meta / Em recria | `Em Recria (27% concluído)` |

---

## 3. Parametrização Zootécnica (`FarmParameters`)

Mapeamento de chaves-valor armazenadas na tabela SQLite `settings`:

| Chave (`key`) | Tipo | Valor Padrão | Faixa Permitida | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `heat_window_days` | Inteiro | `21` | 18 a 26 dias | Janela esperada de retorno de cio |
| `pregnancy_check_days` | Inteiro | `45` | 28 a 90 dias | Prazo para diagnóstico de palpação/ultrassom |
| `gestation_days` | Inteiro | `282` | 270 a 295 dias | Duração média da gestação bovina |
| `dry_off_days` | Inteiro | `60` | 30 a 90 dias | Período de secagem antes da previsão de parto |
| `heifer_breeding_weight_kg` | Inteiro | `360` | 300 a 450 kg | Meta de peso vivo para 1ª Inseminação Artificial |
