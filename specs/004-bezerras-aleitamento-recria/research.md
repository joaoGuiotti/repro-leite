# Research & Architectural Decisions: 004-bezerras-aleitamento-recria

**Feature Branch**: `feature/004-bezerras-aleitamento-recria`  
**Date**: 2026-10-14  
**Context**: Módulo de Bezerras e Recria do ReproLeite (Genealogia em 3 Níveis, Curva de Leite & Recria)

---

## 1. Interface de Usuário: Layout Fiel ao Mockup do Bezerreiro

### Decisão
Implementar a tela de Bezerras (`CalvesScreen`) inspirada exatamente no layout de alta densidade e clareza do protótipo:
1. **Cabeçalho Superior**:
   - Card com ícone temático, título *"Manejo de Bezerras, Genealogia & Desmame"* e subtítulo zootécnico.
   - Botão de ação primária `Botao` (56 px, verde pasto `#1b4332`) *"Cadastrar Nova Bezerra"* acionando modal de cadastro completo.
2. **Layout Responsivo (Master-Detail)**:
   - **Em telas amplas / Web / Tablet**: Dividido em duas colunas laterais (Master List à esquerda e Ficha Detalhada à direita).
   - **Em telas compactas / Mobile**: A lista exibe os cartões com toque tátil ($\ge 48\text{ px}$); ao tocar no cartão, abre a ficha detalhada completa em tela inteira ou modal deslizante com retorno fluido, mantendo idêntica hierarquia visual.
3. **Componentes da Ficha do Animal Selecionado (Painel Direito)**:
   - **Cabeçalho do Animal**: Brinco grande em destaque (`BadgeBrinco`), Nome, badge de idade em dias, data de nascimento e peso ao nascer, com ação de exclusão lógica ("Excluir Bezerra").
   - **Card 1 - Linhagem e Melhoramento Genético**: 3 caixas em linha destacando:
     - *Pai (Touro IA)*: nome do touro vinculado do catálogo.
     - *Mãe (Vaca)*: nome e brinco da vaca do rebanho.
     - *Avó Materna*: nome da avó (mãe da vaca).
   - **Card 2 - Dieta Líquida e Régua de Desmame**:
     - Subtítulo com protocolo: *2L+2L até 15d, 4L+4L até 100d e corte gradual em 3 semanas*.
     - Pill de status da fase atual (ex.: *1 a 15 dias*).
     - Banner de destaque com fundo suave: *"QUANTO ESTA BEZERRA MAMA HOJE"* $\rightarrow$ **2L Cedo + 2L Tarde** (Total: X Litros/dia), informando os dias restantes para a próxima mudança.
     - Tabela / Cronograma com as **datas exatas no calendário** para cada uma das fases:
       - Dia 1: Nascimento & Colostro (4L/dia)
       - Dia 16: Pico de Aleitamento (8L/dia)
       - Dia 101: Desmame: 1ª Semana (4L/dia)
       - Dia 108: Desmame: 2ª Semana (2L/dia)
       - Dia 115: Desmame: 3ª Semana (1L/dia)
       - Dia 122: Desmame Completo (Desmamada - 0L)
   - **Card 3 - Recria & Pesagens Mensais até a 1ª Cria**:
     - Subtítulo explicativo e botão roxo/primário `+ Adicionar Pesagem Mensal`.
     - 4 blocos métricos lado a lado:
       1. **Peso Atual** (com ganho total acumulado desde o nascimento).
       2. **GMD (Ganho Diário)** em g/dia (média do período).
       3. **Meta para 1ª IA** (360 kg, exibindo quantos kg faltam).
       4. **Progresso** (porcentagem e barra de progresso visual).
     - Tabela de histórico de pesagens: Data | Peso (kg) | Anotações.

### Racional
O protótipo aprovado entrega uma densidade de informação ideal para o produtor e tratador de curral, eliminando navegações complexas e apresentando tudo o que é necessário para a tomada de decisão em uma única tela.

---

## 2. Motor Zootécnico Puro de Aleitamento e Desmame

### Decisão
Isolar a regra zootécnica de alimentação em `src/features/calves/domain/calf-feeding.ts`, sem dependências externas, operando sobre strings ISO `YYYY-MM-DD` em UTC.

| Fase | Janela de Idade (dias) | Manhã | Tarde | Total Diário | Descrição / Orientação |
|---|---|---|---|---|---|
| **Inicial** | $0 \le \text{dias} \le 15$ | 2 L | 2 L | 4 L/dia | Ingestão de colostro nas 6h e fase 2L+2L |
| **Pico** | $16 \le \text{dias} \le 100$ | 4 L | 4 L | 8 L/dia | Aumento para 4L manhã e 4L tarde |
| **Corte 1** | $101 \le \text{dias} \le 107$ | 2 L | 2 L | 4 L/dia | 1ª Semana: reduz para 2L+2L |
| **Corte 2** | $108 \le \text{dias} \le 114$ | 1 L | 1 L | 2 L/dia | 2ª Semana: reduz para 1L+1L |
| **Corte 3** | $115 \le \text{dias} \le 121$ | 1 L | 0 L | 1 L/dia | 3ª Semana: 1L apenas pela manhã |
| **Desmamada** | $\text{dias} \ge 122$ | 0 L | 0 L | 0 L/dia | Desmame completo. Ração, feno e água |

### Cálculo de Linha do Tempo de Calendário
Para qualquer bezerra com data de nascimento $D_{\text{nasc}}$:
- $D_{\text{dia1}} = D_{\text{nasc}}$
- $D_{\text{dia16}} = D_{\text{nasc}} + 15\text{ dias}$
- $D_{\text{dia101}} = D_{\text{nasc}} + 100\text{ dias}$
- $D_{\text{dia108}} = D_{\text{nasc}} + 107\text{ dias}$
- $D_{\text{dia115}} = D_{\text{nasc}} + 114\text{ dias}$
- $D_{\text{dia122}} = D_{\text{nasc}} + 121\text{ dias}$

### Racional
A regra é determinística e reproduz exatamente a rotina biológica preconizada na bovinocultura de leite profissional. Usar funções puras em UTC garante 100% de testabilidade contra qualquer data simulada ou real.

---

## 3. Acompanhamento de Recria, Tabela `weighings` e Cálculo de GMD

### Decisão
Criar a tabela `weighings` no SQLite via Drizzle ORM:
```sql
CREATE TABLE weighings (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL,
  animal_id TEXT NOT NULL,
  date TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
```

### Cálculo do GMD (Ganho Médio Diário)
Para um histórico de pesagens ordenadas cronologicamente por `date`:
1. **GMD do Último Período**:
   Entre a pesagem mais recente $(P_n, D_n)$ e a penúltima $(P_{n-1}, D_{n-1})$:
   $$\text{dias} = D_n - D_{n-1}$$
   $$\text{GMD} = \begin{cases} 0 & \text{se dias } \le 0 \\ \operatorname{round}\left(\frac{P_n - P_{n-1}}{\text{dias}} \times 1000\right) & \text{se dias } > 0 \end{cases}$$
2. **GMD Acumulado Desde o Nascimento**:
   Considerando o peso de nascimento $P_0$ (padrão 40 kg ou valor cadastrado) em $D_0$:
   $$\text{GMD}_{\text{acum}} = \operatorname{round}\left(\frac{P_n - P_0}{D_n - D_0} \times 1000\right)$$
3. **Progresso até a 1ª IA**:
   $$\text{Progresso} = \min\left(100, \operatorname{round}\left(\frac{P_n}{360} \times 100\right)\right)$$
   $$\text{Faltam} = \max(0, 360 - P_n)\text{ kg}$$

---

## 4. Transição Automática de Estágio de Vida e Ativação de 1ª IA

### Decisão
1. **Transição Automática**: Ao completar 122 dias de vida (ou registrar peso $\ge 360$ kg), o cálculo de domínio avalia o animal como `novilha`. Ao salvar pesagens ou consultar o animal, o sistema promove `lifeStage: 'novilha'`.
2. **Apta para 1ª IA**: Quando o peso atual for $\ge 360,0$ kg e o sexo for fêmea:
   - Exibe o badge verde de destaque "Apta para 1ª IA".
   - Exibe o botão principal de 56 px "Lançar 1ª Inseminação" redirecionando para `/(tabs)/reproducao?action=inseminate&animalId=${animalId}`.
3. **Machos**: O módulo permite cadastrar e acompanhar bezerros machos no bezerreiro (leite e pesagem), mas oculta os blocos e metas relativos à 1ª Inseminação.

---

## 5. Clean Architecture & Padrão de Repositório

### Decisão
Seguir a arquitetura já estabelecida na feature `today` e no projeto:
```
src/features/calves/
├── domain/
│   ├── calves.types.ts           # Interfaces, DTOs, ViewModels
│   ├── calf-feeding.ts           # Motor puro de aleitamento e linha do tempo
│   ├── calf-weight.ts            # Motor puro de cálculo de GMD e metas
│   ├── calves.repository.ts      # Contrato (port) do repositório
│   └── __tests__/
├── application/
│   ├── register-calf.usecase.ts
│   ├── record-weighing.usecase.ts
│   ├── get-calves-dashboard.usecase.ts
│   ├── get-calf-details.usecase.ts
│   ├── delete-calf.usecase.ts
│   └── __tests__/
├── infra/
│   ├── weighings.schema.ts       # Tabela SQLite via Drizzle
│   ├── calves.queries.ts         # Queries enriquecidas
│   ├── calves.repository.impl.ts # Implementação concreta com SQLite e Outbox
│   └── __tests__/
├── presentation/
│   ├── components/
│   │   ├── CalfListCard.tsx
│   │   ├── CalfDetailPane.tsx
│   │   ├── CalfGenealogyCard.tsx
│   │   ├── CalfFeedingTimelineCard.tsx
│   │   ├── CalfWeightGrowthCard.tsx
│   │   ├── RegisterCalfModal.tsx
│   │   └── AddWeighingModal.tsx
│   ├── hooks/
│   │   ├── useCalvesList.ts
│   │   ├── useCalfDetails.ts
│   │   └── useCalfActions.ts
│   └── screens/
│       └── CalvesScreen.tsx      # Tela principal completa
├── factory.ts                    # Composition root
└── index.ts                      # API pública
```
