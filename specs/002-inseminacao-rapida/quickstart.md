# Quickstart & Verification Guide: Inseminação Rápida no Curral

**Feature**: `002-inseminacao-rapida`  
**Date**: 2026-10-14  

Este documento apresenta os cenários executáveis para validação técnica e operacional da feature de Inseminação Rápida.

---

## 1. Pré-requisitos & Comandos de Teste Automatizado

### 1.1 Suíte de Testes Unitários de Domínio

Executar todos os testes de reprodução e consanguinidade com Jest:

```bash
npm test -- reproduction.test.ts consanguinity.test.ts
```

**Resultado Esperado**:
- 100% dos testes passam.
- Validação das datas de marcos: `2026-10-14` $\rightarrow$ Cio: `2026-11-04`, Toque: `2026-11-28`, Parto: `2026-07-23`, Secagem: `2026-05-24`.
- Detecção determinística de consanguinidade pai x filha e avô x neta.
- Restauração correta de status reprodutivo após cancelamento.

### 1.2 Verificação de Tipos e Linter

```bash
npx tsc --noEmit
npx expo lint
```

---

## 2. Roteiro de Validação Manual no Curral (Passo a Passo)

### Cenário 1: Inseminação em 3 Toques no Curral
1. Abra o app ReproLeite e navegue para a aba **Reprodução**.
2. Toque na nova seção do topo **Inseminar**.
3. **Toque 1 (Vaca)**: Toque em "Selecionar Fêmea", digite o brinco de uma vaca vazia (ex.: "101") no teclado numérico e selecione-a.
4. **Toque 2 (Touro)**: Toque em "Selecionar Touro" e escolha um touro catalogado que possua saldo de doses (ex.: "Jaguar TE — 5 doses").
5. Verifique se o **Painel de Projeções Zootécnicas** atualizou instantaneamente com as 4 datas calculadas.
6. **Toque 3 (Confirmar)**: Toque no botão verde grande **"Confirmar e Concluir"**.
7. **Resultado Esperado**:
   - Mensagem de sucesso na tela.
   - O status da vaca "101" na lista do rebanho passa para `"Inseminada"`.
   - O saldo de doses do touro "Jaguar TE" reduz de 5 para 4.
   - O formulário é limpo para o próximo animal.

---

### Cenário 2: Fluxo Sequencial com Atalho "Confirmar e Inseminar Outra"
1. Na tela de Inseminação, selecione uma fêmea (ex.: "102") e o touro "Touro Elite".
2. Toque no botão primário **"Confirmar e Inseminar Outra"**.
3. **Resultado Esperado**:
   - A inseminação da vaca "102" é gravada no banco local.
   - O modal de seleção de fêmeas abre imediatamente na tela.
   - O touro "Touro Elite", a data de manejo e o inseminador permanecem automaticamente pré-selecionados.
   - Selecionar a próxima vaca (ex.: "103") já exibe as projeções prontas com o mesmo touro.

---

### Cenário 3: Alerta Visual de Consanguinidade
1. Cadastre ou selecione uma novilha cuja filiação registre o touro "Jaguar TE" como pai.
2. Na tela de Inseminação, selecione essa novilha.
3. No campo de reprodutor, selecione o mesmo "Jaguar TE".
4. **Resultado Esperado**:
   - O componente `BannerAlerta` em tom âmbar surge com o aviso: *"Atenção: Consanguinidade de 1º Grau detectada (Jaguar TE é pai desta vaca)"*.
   - O botão de confirmação permanece protegido até que o usuário toque em "Prosseguir mesmo assim" no banner de alerta.

---

### Cenário 4: Touro com Estoque Zerado & Abastecimento Rápido
1. Selecione um touro cujo saldo de palhetas esteja em 0 doses.
2. **Resultado Esperado**:
   - O sistema exibe o diálogo contextual com duas opções: *"Inseminar mesmo assim"* e *"+ Adicionar Doses"*.
   - Ao tocar em *"+ Adicionar Doses"*, digite "10" e confirme.
   - O saldo do touro no botijão é atualizado para 10 doses sem fechar o formulário de inseminação e sem perder a vaca já selecionada.

---

### Cenário 5: Exclusão com Restauração Inteligente de Status & Estorno de Doses
1. Na seção "Inseminações Recentes", localize a última inseminação lançada por engano.
2. Toque em "Excluir Inseminação".
3. Confirme a opção de "Devolver 1 dose ao estoque do touro".
4. **Resultado Esperado**:
   - O saldo de doses do touro é incrementado em 1.
   - A vaca tem seu status reprodutivo recalculado pelo motor zootécnico (voltando a "Vazia" ou ao estado prévio).
   - Os alertas zootécnicos gerados por aquela IA são cancelados.
