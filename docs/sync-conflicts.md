# Política de Resolução de Conflitos de Sincronização

Este documento estabelece as regras formais de resolução de conflitos entre o banco local (`SQLite`) e a nuvem (`Supabase`) no aplicativo **repro-leite**, conforme a arquitetura Offline-First definida no projeto.

---

## 1. Princípios Gerais

1. **SQLite como Fonte Local de Verdade:** A interface do usuário (UI) lê exclusivamente do SQLite local. Mutações da nuvem são trazidas pelo motor de sync (*pull*) e aplicadas de forma transacional.
2. **Idempotência por `operation_id`:** Toda escrita originada no cliente recebe um `operation_id` (UUID v7). Reenvios causados por oscilação de rede são identificados e desconsiderados pelo servidor sem gerar duplicações.
3. **Tombstones para Exclusão:** Tabelas sincronizáveis utilizam exclusão lógica (`deleted_at`). A exclusão se propaga como uma mutação normal, evitando registros zumbis.
4. **Resolução Determinística:** Dados simples adotam **Last-Write-Wins (LWW)** baseado no timestamp `updated_at`. Dados críticos ou quantitativos (como estoque de doses) adotam regras aditivas/derivadas.

---

## 2. Matriz de Resolução por Entidade

| Entidade | Estratégia de Conflito | Regra Aplicada |
|---|---|---|
| `animals` | **Last-Write-Wins (LWW)** | Vence o registro com o maior `updated_at`. Se o campo `deleted_at` estiver preenchido no mais recente, o animal permanece arquivado/inativo. |
| `bulls` (catálogo) | **Last-Write-Wins (LWW)** | Nome, raça e código adotam LWW pelo `updated_at`. |
| `bulls` (estoque de doses) | **Movimentações / Delta** | O saldo de doses nunca deve ser sobrescrito cegamente. Cada inseminação ou ajuste gera uma movimentação rastreada; o saldo reflete o somatório das entradas menos as saídas. |
| `inseminations` | **Last-Write-Wins (LWW)** | Informações de diagnóstico de gestação e anotações adotam LWW. Inseminações confirmadas têm precedência sobre status pendente. |
| `alerts` | **Merge com Precedência de Conclusão** | Se um alerta foi marcado como concluído (`completed_at != null`) em qualquer ponta, o estado concluído prevalece. Anotações seguem LWW. |
| `settings` | **Last-Write-Wins (LWW)** | A chave mais recente por `updated_at` atualiza o parâmetro da fazenda. |
| `farms` | **Server-Wins** | Dados cadastrais e limites do plano/fazenda são arbitrados pelo servidor. |

---

## 3. Detalhamento das Políticas

### 3.1 Last-Write-Wins (LWW)
Para entidades operacionais gerais:
- Se `remote.updated_at > local.updated_at`:
  - O registro local é atualizado com os dados remotos.
  - O cursor `server_rev` local é avançado.
- Se `local.updated_at >= remote.updated_at`:
  - A versão local é preservada.
  - Se houver alteração local não sincronizada, a operação correspondente na `sync_queue` garantirá o envio posterior do registro local.

### 3.2 Tombstones (Soft-Delete)
- Se um registro remoto possui `deleted_at != null` e `remote.updated_at >= local.updated_at`:
  - O registro local tem seu `deleted_at` preenchido, preservando integridade referencial.
- Se o registro local foi deletado enquanto estava offline, a exclusão é enviada na outbox e confirmada na nuvem.

### 3.3 Estoque de Sêmen (Doses)
- O catálogo do touro armazena informações cadastrais.
- Consumos de doses são gerados pelas inseminações. Ao sincronizar, o cliente não envia uma contagem absoluta sobrescrevendo a nuvem; ele sincroniza a inseminação e eventuais movimentações de ajuste.

---

## 4. Ciclo de Execução no Engine

1. **Push:** Drena a fila `sync_queue` enviando itens em lote acompanhados de seu `operation_id`.
2. **Pull:** Consulta o backend passando o último cursor (`server_rev` e `last_pulled_at`).
3. **Apply & Resolve:** Itera sobre as mudanças recebidas, acionando o `ConflictResolver` para cada registro antes de persistir no SQLite em bloco transacional.
4. **Commit de Cursor:** Atualiza `sync_state` com o novo `server_rev` e `last_pulled_at`.
