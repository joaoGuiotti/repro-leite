# Quickstart & Guia de Validação: Rebanho & Catálogo de Touros (Feature 001)

**Feature Branch**: `001-rebanho-e-touros`  
**Date**: 2026-10-14  

---

## 1. Pré-Requisitos e Ambiente

1. Projeto configurado com dependências locais instaladas (`npm install`).
2. Banco SQLite local inicializado com as tabelas `farms`, `animals`, `bulls`, `sync_queue`.

---

## 2. Cenários de Teste Ponta a Ponta

### Cenário 1: Política de Reuso de Brinco (Bloqueio de Ativo vs Alerta de Inativo)
1. **Passo 1**: Cadastrar animal "Mimosa", brinco `"104"`, raça `"Holandesa"`, sexo `"femea"`, status `"ativo"`.
   - **Resultado Esperado**: Animal gravado com sucesso no SQLite e registrado na `sync_queue`.
2. **Passo 2**: Tentar cadastrar novo animal com brinco `"104"` (ou `" 104 "`).
   - **Resultado Esperado**: O formulário bloqueia o salvamento e exibe aviso claro: *"Brinco 104 já está em uso pela vaca Mimosa"*, com atalho para a ficha dela.
3. **Passo 3**: Na ficha de "Mimosa", acionar *"Registrar Saída"* com motivo `"Vendido"`.
   - **Resultado Esperado**: "Mimosa" torna-se inativa (`exit_status = 'vendido'`), liberando o número do brinco.
4. **Passo 4**: Tentar novamente cadastrar animal com brinco `"104"`.
   - **Resultado Esperado**: O sistema exibe destaque em amarelo informando que o brinco pertenceu à vaca Mimosa vendida e exibe os botões *"Usar mesmo assim"* e *"Mudar número"*. Ao confirmar *"Usar mesmo assim"*, o novo animal é salvo como ativo.

---

### Cenário 2: Busca Ágil e Filtragem Zootécnica por Status
1. **Passo 1**: Com animais cadastrados com status variados (*Vazias, Inseminadas, Prenhes, Secas* e um bezerro *Macho*).
2. **Passo 2**: Digitar `"10"` no campo de busca.
   - **Resultado Esperado**: A lista filtra instantaneamente (< 200ms) os animais cujo brinco ou nome contenha `"10"`.
3. **Passo 3**: Tocar na pílula *"Prenhes"*.
   - **Resultado Esperado**: A lista exibe somente vacas com `repro_status = 'prenhe'`. O macho não aparece.
4. **Passo 4**: Tocar em *"Todas"*.
   - **Resultado Esperado**: Todos os animais ativos aparecem, com o macho identificado por selo de sexo.

---

### Cenário 3: Catálogo de Touros e Gestão de Doses de Sêmen
1. **Passo 1**: Acessar aba *"Touros"*, tocar em *"Novo Touro"* e cadastrar *"Jaguar TE"*, raça *"Gir Leiteiro"*, código *"GIR-8821"*, doses em estoque `5`.
   - **Resultado Esperado**: Touro registrado e exibido no catálogo com badge verde de 5 doses.
2. **Passo 2**: Tocar no botão `+` de ajuste rápido de doses.
   - **Resultado Esperado**: O saldo sobe para 6 doses imediatamente.
3. **Passo 3**: Reduzir as doses até 0.
   - **Resultado Esperado**: O cartão do touro exibe selo em destaque *"Estoque Zerado"*. Tentativas de subtrair abaixo de 0 são bloqueadas.

---

## 3. Comandos de Verificação e Qualidade

Execute a suíte de testes unitários dos motores de domínio:
```bash
npm test
```

Execute a validação de tipos TypeScript:
```bash
npx tsc --noEmit
```

Execute o linter oficial do Expo:
```bash
npx expo lint
```
