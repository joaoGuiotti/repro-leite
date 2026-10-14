# Quickstart & E2E Validation: 004-bezerras-aleitamento-recria

**Feature Branch**: `feature/004-bezerras-aleitamento-recria`  
**Date**: 2026-10-14  
**Context**: Guia de validação funcional e ponta a ponta dos fluxos de Bezerras, Genealogia, Desmame e Recria.

---

## Pré-requisitos & Configuração

1. Banco de dados SQLite local ativo com a tabela `weighings` criada.
2. Fazenda padrão inicializada (`farm_id: 'farm-default'` ou selecionada).
3. Ao menos 1 vaca cadastrada no rebanho e 1 touro no catálogo para teste de genealogia.

Comandos para verificação de tipos e suíte de testes:
```bash
npx tsc --noEmit
npm test
npx eslint src/features/calves
```

---

## Cenário 1: Cadastro de Bezerra com Genealogia em 3 Níveis

### Objetivo
Validar que o tratador consegue cadastrar uma nova bezerra, com árvore genealógica de 3 níveis e peso inicial gravados no SQLite e enfileirados na outbox.

### Passos de Teste
1. Acessar a aba **"Bezerras"** no aplicativo.
2. Tocar no botão principal **"+ Cadastrar Nova Bezerra"** no cabeçalho.
3. Preencher:
   - **Brinco**: `501`
   - **Nome**: `Princesa`
   - **Sexo**: `Fêmea`
   - **Data de Nascimento**: data de hoje menos 13 dias.
   - **Peso ao Nascer**: `41` kg.
   - **Pai (Touro IA)**: selecionar touro `Jaguar TE do Gavião`.
   - **Mãe (Vaca)**: selecionar vaca `Estrela (104)`.
   - **Avó Materna**: informar `Cigana`.
4. Salvar o cadastro.

### Resultado Esperado
- Bezerra `501 - Princesa` surge instantaneamente na lista à esquerda com badge `4L/dia` e `13 dias (Fase Inicial)`.
- No painel da direita, o bloco **Linhagem e Melhoramento Genético** exibe os 3 cartões:
  - Pai: *Jaguar TE do Gavião*
  - Mãe: *Estrela (104)*
  - Avó Materna: *Cigana*
- Registro na tabela `animals` e mutação `INSERT` gravada na `sync_queue`.

---

## Cenário 2: Linha do Tempo de Desmame e Volume Diário

### Objetivo
Validar o cálculo determinístico das 6 fases de aleitamento e o cronograma de corte.

### Passos de Teste
1. Selecionar a bezerra `501` (13 dias de vida).
2. Verificar o bloco **"Dieta Líquida e Régua de Desmame"**.

### Resultado Esperado
- Status do destaque: *"QUANTO ESTA BEZERRA MAMA HOJE"* $\rightarrow$ **2L Cedo + 2L Tarde** (Total: **4 Litros/dia**).
- Pill de fase: `1 a 15 dias`.
- Tabela de datas exatas calculada a partir de $D_{\text{nasc}}$:
  - Dia 1: $D_{\text{nasc}}$ (4L/dia)
  - Dia 16: $D_{\text{nasc}} + 15\text{d}$ (8L/dia)
  - Dia 101: $D_{\text{nasc}} + 100\text{d}$ (4L/dia)
  - Dia 108: $D_{\text{nasc}} + 107\text{d}$ (2L/dia)
  - Dia 115: $D_{\text{nasc}} + 114\text{d}$ (1L/dia)
  - Dia 122: $D_{\text{nasc}} + 121\text{d}$ (Desmamada - 0L)

---

## Cenário 3: Registro de Pesagens Periódicas e Cálculo de GMD

### Objetivo
Validar que pesagens sucessivas geram o Ganho Médio Diário em g/dia corretamente.

### Passos de Teste
1. Na ficha da bezerra, tocar no botão **"+ Adicionar Pesagem Mensal"**.
2. Lançar pesagem com data de 30 dias após o nascimento com peso de `71` kg.
3. Confirmar o registro.

### Resultado Esperado
- Cálculo do GMD:
  $$\text{Ganho} = 71 - 41 = 30\text{ kg em 30 dias} \rightarrow \mathbf{1000\text{ g/dia}}$$
- O card de métricas atualiza:
  - **Peso Atual**: 71 kg (+30kg)
  - **GMD**: 1.000 g/dia
  - **Meta para 1ª IA**: 360 kg (Faltam 289kg)
  - **Progresso**: 20%
- A tabela de histórico lista as pesagens ordenadas cronologicamente.

---

## Cenário 4: Meta Batida e Ação Rápida para 1ª Inseminação

### Objetivo
Validar a transição de novilha apta ao atingir ou superar 360 kg.

### Passos de Teste
1. Cadastrar ou selecionar novilha com idade $\ge 122$ dias (ex.: `450 - Dourada`).
2. Adicionar uma pesagem de `365` kg.
3. Observar a atualização da ficha.
4. Tocar no botão de ação rápida **"Lançar 1ª Inseminação"**.

### Resultado Esperado
- O card de métricas exibe badge de destaque verde **"Apta para 1ª IA"** (Progresso: 100%).
- Surge o botão principal de 56 px "Lançar 1ª Inseminação".
- O toque no botão navega para a rota `/(tabs)/reproducao?action=inseminate&animalId=${animalId}` com o formulário aberto e a novilha pré-selecionada.

---

## Cenário 5: Resiliência Offline & Fila de Outbox

### Objetivo
Validar que o tratador consegue realizar todas as operações de bezerreiro sem internet.

### Passos de Teste
1. Desconectar o dispositivo da rede (Modo Avião).
2. Cadastrar uma nova bezerra e lançar duas pesagens.
3. Consultar a lista e navegar entre os animais.

### Resultado Esperado
- Operações concluem em $< 100\text{ ms}$ gravadas localmente no SQLite.
- Registros exibem o selo discreto `PendingSyncBadge` indicando sincronização pendente na outbox.
