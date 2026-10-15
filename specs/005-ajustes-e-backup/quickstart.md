# Quickstart & Guia de Validação: 005-ajustes-e-backup

**Feature**: `005-ajustes-e-backup`  
**Date**: 2026-10-15  
**Context**: Roteiro de testes ponta a ponta para validação da exportação CSV, backup/restauração e ajustes zootécnicos.

---

## 1. Pré-Requisitos e Setup de Testes

1. Ter o ambiente do aplicativo em execução:
   ```bash
   npx expo start
   ```
2. Garantir que existam animais e dados cadastrados no banco SQLite local (utilizar a tela de Rebanho, Inseminação e Bezerras para registrar ou conferir pelo menos 2 vacas, 1 touro, 1 inseminação e 1 bezerra com pesagens).

---

## 2. Cenários de Validação Ponta a Ponta

### Cenário 1: Exportação de Planilhas CSV (Rebanho e Bezerras)
1. Abra o aplicativo e navegue até a aba **Ajustes**.
2. No cartão *"Backup & Segurança dos Dados"*, toque em **"CSV Rebanho"**.
   - **Resultado Esperado**: O sistema gera o arquivo `rebanho_export_[data].csv` e exibe a folha de compartilhamento nativa (WhatsApp, Drive, Salvar em Arquivos). Ao abrir no Excel ou leitor de planilhas, colunas como `BRINCO`, `STATUS_REPRODUTIVO` e `DATA_ULTIMA_IA` estão perfeitamente formatadas com acentos e separador `;`.
3. Retorne ao app e toque em **"CSV Bezerras"**.
   - **Resultado Esperado**: O arquivo `bezerras_export_[data].csv` é gerado contendo genealogia (Mãe, Pai, Avó), peso de nascimento, pesagens e GMD formatado.

### Cenário 2: Backup em 1 Toque para WhatsApp e Cópia
1. Na aba **Ajustes**, toque no botão principal **"Exportar Backup para WhatsApp (JSON)"**.
   - **Resultado Esperado**: O arquivo `backup_reproleite_[data].json` é gerado em menos de 2 segundos. A folha de compartilhamento é aberta permitindo selecionar um contato do WhatsApp para envio direto.
2. Acione a opção de cópia rápida para a área de transferência.
   - **Resultado Esperado**: Vibração háptica de confirmação e mensagem toast/aviso *"Backup copiado para a área de transferência"*. Ao colar em um editor de texto, o JSON completo é exibido.

### Cenário 3: Restauração Segura de Dados (Disaster Recovery)
1. Toque em **"Restaurar Dados de Arquivo JSON"**.
   - **Resultado Esperado**: O aplicativo exibe modal de confirmação com aviso em destaque: *"Atenção: A restauração substituirá todos os registros locais atuais pelo conteúdo do arquivo de backup. Deseja continuar?"*.
2. Confirme e selecione o arquivo JSON de backup gerado anteriormente.
   - **Resultado Esperado**: O aplicativo valida a integridade do JSON, substitui os dados em transação atômica e exibe mensagem de sucesso. A lista de animais e histórico na tela refletem os dados restaurados.
3. Repita o teste selecionando um arquivo de texto qualquer inválido (não-JSON ou schema incorreto).
   - **Resultado Esperado**: O aplicativo rejeita o arquivo, exibe mensagem clara de erro e **não altera** nenhum dado existente no banco SQLite.

### Cenário 4: Customização dos Parâmetros da Fazenda
1. No cartão *"Parâmetros da Fazenda"*, toque em **"Editar Metas e Prazos"**.
2. Altere o *Diagnóstico de Toque* de 45 para 35 dias e salve.
   - **Resultado Esperado**: O cartão atualiza imediatamente para "35 dias". O cálculo de tarefas na aba "Hoje" passa a utilizar o novo parâmetro para projetar toques.

---

## 3. Comandos de Verificação Automatizada

Antes de finalizar as tarefas da feature, execute:
```bash
# Validação de tipagem estrita
npx tsc --noEmit

# Execução da suíte de testes unitários e de integração
npm test

# Validação de lint e regras de dependência arquitetural
npx eslint .
```
