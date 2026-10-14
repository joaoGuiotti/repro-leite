# Research & Architectural Decisions: Inseminação Rápida, Baixa de Doses, Projeções e Consanguinidade

**Feature**: `002-inseminacao-rapida`  
**Date**: 2026-10-14  
**Author**: Spec Kit Planning Agent  

---

## 1. Contexto & Objetivos Zootécnicos

A feature `002-inseminacao-rapida` implementa o coração do ciclo reprodutivo do aplicativo **ReproLeite**. No manejo de gado leiteiro, a inseminação artificial (IA) demanda agilidade máxima no curral, cálculo determinístico dos marcos biológicos (retorno de cio, toque veterinário, previsão de parto e secagem), controle atômico do saldo de doses de sêmen no botijão e prevenção imediata de cruzamentos consanguíneos deletérios.

---

## 2. Decisões Arquiteturais e de Engenharia

### Decisão 1: Motores de Domínio Zootécnico em TypeScript Puro (`src/domain/`)

- **Decisão**: Isolar todo cálculo temporal reprodutivo e análise genealógica em funções puras nos arquivos `src/domain/reproduction.ts` e `src/domain/consanguinity.ts`, com zero dependências de React Native, Expo ou SQLite.
- **Marcos Reprodutivos Canônicos**:
  - `expected_heat_date`: Data da IA + 21 dias (janela típica de retorno de cio).
  - `pregnancy_check_date`: Data da IA + 45 dias (toque retal / diagnóstico veterinário).
  - `expected_calving_date`: Data da IA + 282 dias (gestação bovina média leiteira).
  - `dry_off_date`: Data do Parto Previsto - 60 dias (período seco pré-parto = Data da IA + 222 dias).
- **Tratamento de Datas**:
  - Manipulação estrita de strings canônicas `YYYY-MM-DD` (sem horas nem fusos horários), prevenindo desvios provocados por fuso horário local ou horário de verão.
- **Restauração Determinística de Status**:
  - Ao excluir/cancelar uma inseminação lançada por engano, a função `resolveAnimalReproStatusAfterCancellation` examina o histórico: se houver inseminação anterior válida sem desfecho negativo, mantém o animal como `'inseminada'`; caso contrário, restaura para `'vazia'`.
- **Alternativas Rejeitadas**:
  - *Calcular datas na interface (React state/hooks)*: Rejeitado por dificultar testes automatizados unitários e quebrar o Princípio II da Constituição.
  - *Uso de objetos `Date` nativos do JS com timestamp*: Rejeitado devido a distorções conhecidas de fuso horário em sincronização distribuída (Princípio IV).

---

### Decisão 2: Análise Determinística de Consanguinidade (`src/domain/consanguinity.ts`)

- **Decisão**: A função pura `checkConsanguinity` compara o touro selecionado (por `id` ou `name` normalizado) contra a filiação do animal receptor:
  - **1º Grau (Pai)**: Touro selecionado igual ao `sire_id` ou compatível com `sire_name`. Retorna `{ isConsanguineous: true, degree: '1st_degree', relation: 'pai', warning: 'Atenção: O touro selecionado é pai desta vaca.' }`.
  - **2º Grau (Avô)**: Touro selecionado igual ao pai da mãe (avô materno cadastrado em `animals`) ou igual a `maternal_grandsire_name` / `paternal_grandsire_name`. Retorna `{ isConsanguineous: true, degree: '2nd_degree', relation: 'avo', warning: 'Atenção: O touro selecionado é avô desta vaca.' }`.
- **Comportamento no Curral**:
  - Não bloqueia forçadamente o botão de salvar caso o produtor esteja fazendo acasalamento orientado intencional; exibe o `BannerAlerta` em tom âmbar e exige toque de ciência ("Prosseguir mesmo assim").

---

### Decisão 3: Transações Atômicas Locais e Persistência no SQLite (`src/db/`)

- **Decisão**: Modelar as tabelas `inseminations` e `alerts` no Drizzle ORM (`expo-sqlite`) com chave primária UUID v4, tenant isolado (`farm_id`), auditoria UTC e suporte a exclusão lógica (`deleted_at`).
- **Operação de Inseminação**:
  - Executada no repositório `InseminationRepository.createInsemination`:
    1. Grava registro em `inseminations`.
    2. Atualiza `animals` (`repro_status = 'inseminada'`).
    3. Se o touro for catalogado, debita 1 dose em `bulls` (`straws_in_stock = Math.max(0, straws - 1)`).
    4. Grava os 2 alertas em `alerts` (`heat_check_21d` e `pregnancy_check_45d`) com `due_date` canônica e `source_id = insemination.id`.
    5. Insere eventos de mutação na `sync_queue` para sincronização assíncrona com Supabase.
- **Operação de Exclusão/Estorno**:
  - Executada em `InseminationRepository.deleteInsemination`:
    1. Marca `deleted_at` na inseminação.
    2. Marca `deleted_at` nos alertas vinculados àquela inseminação (`source_id`).
    3. Se solicitado estorno, incrementa `straws_in_stock` do touro em 1 dose.
    4. Restaura o status do animal para `'inseminada'` (se houver IA anterior ativa) ou `'vazia'`.
    5. Enfileira na `sync_queue`.

---

### Decisão 4: Primitivas Reutilizáveis de UI (`src/ui/`) para Ergonomia Rural

Em conformidade direta com a solicitação do usuário e os princípios da Constituição ReproLeite (Princípio III), implementaremos em `src/ui/` quatro novos componentes visuais desacoplados e altamente reaproveitáveis:

1. **`BannerAlerta.tsx`**:
   - Alerta contextual com variações semânticas (`'alerta' | 'atencao' | 'sucesso' | 'info'`).
   - Ícones de `lucide-react-native` (`AlertTriangle`, `AlertCircle`, `CheckCircle2`, `Info`).
   - Alto contraste solar, fundo âmbar suave (`bg-ambar-50`), borda destacada (`border-ambar-300`), tipografia nítida e botão tátil de ação secundária/confirmação.
2. **`PainelProjecaoZootecnica.tsx`**:
   - Grid de 4 cartões de projeções reprodutivas (`Retorno Cio 21d`, `Toque 45d`, `Parto Previsto 282d`, `Secagem -60d`).
   - Cada cartão exibe ícone, rótulo descritivo, data formatada (`DD/MM/AAAA`) e selo de deslocamento temporal relativo (`+21 dias`).
3. **`SeletorItemModal.tsx`**:
   - Modal com `ModalPadrao`, campo de busca integrado com teclado numérico/alfanumérico, pílulas de filtro de status rápido e lista com alvos de toque de 48px/56px.
   - Usado para selecionar fêmeas e touros, e reaproveitável nas próximas telas.
4. **`BadgeEstoqueDoses.tsx`**:
   - Selo visual de contagem de doses com codificação por disponibilidade zootécnica:
     - Verde (`bg-pasto-100 text-pasto-800`): $> 3$ doses.
     - Âmbar (`bg-ambar-100 text-ambar-800`): $1$ a $3$ doses.
     - Vermelho (`bg-alerta-100 text-alerta-800`): $0$ doses (estoque zerado).

---

### Decisão 5: Integração de Telas e Fluxo no Curral (`src/app/(tabs)/reproducao.tsx`)

- **Seletor Superior de Abas**:
  - `TelaReproducao` expande de `'rebanho' | 'touros'` para `'rebanho' | 'touros' | 'inseminar'`.
- **Ações Primárias**:
  - Botão `"Confirmar e Concluir"`: Salva e retorna o formulário ao estado inicial limpo.
  - Botão `"Confirmar e Inseminar Outra"`: Salva a vaca atual e reabre instantaneamente o `SeletorItemModal` de animais, mantendo touro, data e inseminador selecionados.
- **Atalho no Cartão de Vaca**:
  - No cartão de fêmeas com status "Vazia" ou "Apta para IA" na lista do rebanho, é incluído o botão secundário `"Inseminar"`, que navega diretamente para a seção de inseminação com o animal pré-carregado.
