# Technical Research: Rebanho & Catálogo de Touros (Feature 001)

**Feature Branch**: `001-rebanho-e-touros`  
**Date**: 2026-10-14  
**Status**: Completed  

---

## 1. Pesquisa & Decisões Técnicas

### Decisão 1: Normalização de Brinco e Política de Unicidade Parcial no SQLite
- **Contexto**: O brinco é a chave visual de identificação animal no curral. Vaqueiros podem digitar espaços ou letras minúsculas (ex: `" a 12 "` vs `"A12"`). Animais ativos não podem ter brincos duplicados, mas animais vendidos, descartados ou mortos (saídas) liberam o número para reuso.
- **Decisão**: 
  1. Implementar função pura `normalizeEarTag(tag: string): string` que remove espaços em branco extras, pontuações acidentais e converte para maiúsculo (ex: `" 104-b "` $\rightarrow$ `"104B"`).
  2. Persistir `ear_tag` (texto digitado original) e `ear_tag_normalized` no SQLite.
  3. Criar índice único parcial no SQLite: `CREATE UNIQUE INDEX IF NOT EXISTS idx_animals_farm_ear_tag_active ON animals (farm_id, ear_tag_normalized) WHERE deleted_at IS NULL AND exit_status = 'ativo'`.
- **Justificativa**: Garante unicidade absoluta ao nível do banco de dados local para animais ativos, sem impedir que brincos de animais antigos sejam reutilizados.
- **Alternativas rejeitadas**: 
  - *Índice único global simples*: Rejeitado porque impediria o reuso de brinco mesmo após a venda ou morte da vaca anterior.
  - *Validação apenas em memória no React*: Rejeitada por risco de race condition e corrupção de dados ao salvar em lote.

---

### Decisão 2: Distinção entre Saída do Rebanho (*Exit Status*) e Exclusão Lógica (*Soft Delete*)
- **Contexto**: No manejo de gado leiteiro, uma vaca que foi vendida ou morreu não deve ser excluída do histórico da fazenda, pois ela é mãe de bezerras e possui histórico produtivo.
- **Decisão**:
  1. **Saída do Rebanho (`exit_status`)**: Valores `'ativo' | 'vendido' | 'descartado' | 'morto'`. Acompanhado de `exit_date` (`YYYY-MM-DD`) e `exit_reason`. O animal continua no banco (`deleted_at IS NULL`), liberando o brinco e desativando alertas futuros.
  2. **Exclusão Lógica (`deleted_at`)**: Usada estritamente quando um registro foi criado por engano operacional. O registro é marcado com `deleted_at` (tombstone) para propagação de exclusão no Supabase.
- **Justificativa**: Preserva 100% da integridade genealógica e histórica zootécnica sem poluir a lista diária do curral.

---

### Decisão 3: Motores de Regras Puros em `src/domain/` (TDD Estrito)
- **Contexto**: A Constituição do ReproLeite (Princípio II) exige que toda a lógica zootécnica e de negócios resida em funções puras TypeScript, determinísticas e sem dependência de React ou SQLite.
- **Decisão**:
  1. `src/domain/earTag.ts`:
     - `normalizeEarTag(tag: string): string`
     - `evaluateEarTagAvailability(existingAnimals: AnimalSummary[], newTag: string): EarTagEvaluationResult` (retorna `'disponivel' | 'bloqueado_ativo' | 'alerta_reuso_inativo'`).
  2. `src/domain/animalFilters.ts`:
     - `filterAnimals(animals: Animal[], filters: AnimalFilterOptions): Animal[]` (aplica busca textual por brinco/nome, filtro por status reprodutivo e exclusão automática de machos de filtros específicos de fêmeas).
  3. `src/domain/bullStock.ts`:
     - `adjustBullStock(currentStraws: number, delta: number): number` (impede estoque negativo de doses e valida limites).
- **Justificativa**: Permite cobertura de testes unitários de 100% via Jest, executando em milissegundos e blindando as regras contra alterações de UI ou dependências.

---

### Decisão 4: Transacionalidade com Fila de Sincronização Local (`sync_queue`)
- **Contexto**: O ReproLeite opera em modo offline contínuo. Toda modificação local deve ser persistida para envio futuro à nuvem.
- **Decisão**: Toda criação, alteração cadastral, registro de saída ou ajuste de estoque executa em uma transação do SQLite que:
  1. Grava a linha na tabela de negócio (`animals` ou `bulls`) atualizando `updated_at`.
  2. Insere um registro na tabela `sync_queue` com a operação (`INSERT`, `UPDATE` ou `DELETE`) e o identificador do registro.
- **Justificativa**: Garante atomicidade: nunca haverá dados locais sem o correspondente registro na fila de sincronização.

---

### Decisão 5: Ergonomia Rural e Interface da Aba "Reprodução"
- **Contexto**: A tela precisa ser legível sob sol intenso e de toque fácil com mãos sujas/enluvadas.
- **Decisão**:
  1. Aba "Reprodução" (`src/app/(tabs)/reproducao/index.tsx`) apresenta seletor superior segmentado entre "Rebanho" (vacas e novilhas) e "Touros" (catálogo e palhetas).
  2. Alvos de toque primários com altura mínima de 56px (`min-h-14`) via componente `Botao`.
  3. Teclado numérico por padrão para entrada de brinco e contagem de doses (`CampoNumerico`).
  4. Selos coloridos de alto contraste (`SeloStatus`) para indicar *Vazia* (cinza escuro), *Inseminada* (azul), *Prenhe* (verde pasto), *Seca* (terra) e *Inativa* (âmbar).
