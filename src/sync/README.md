# Sync (Sprint 2)
- `push.ts`: lê `sync_queue` em lotes, `upsert` no Supabase, remove da fila só após confirmação, backoff exponencial.
- `pull.ts`: `server_updated_at > last_pulled_at`, paginado; aplica "último que alterou vence" por `updated_at`.
- Gatilhos: abrir app, voltar ao primeiro plano, reconexão (`expo-network`), após salvar (debounce), tarefa em segundo plano.
- Conflito de brinco: registro mais antigo fica; o outro vira `ear_tag_conflict = true` até o usuário informar novo número.
