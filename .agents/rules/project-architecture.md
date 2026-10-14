---
trigger: always_on
---

# Regras do Projeto: repro-leite

Stack: **React Native (Expo) + Expo Router + NativeWind (Tailwind) + lucide-react-native + expo-sqlite (offline-first) + Supabase (futuro)**.
Arquitetura: **feature-first + Clean Architecture**. Siga estas regras em toda tarefa. Em conflito com pedido do usuário, avise antes de violar.

---

## 1. Princípios inegociáveis

1. **Offline-first.** O SQLite local é a fonte da verdade. A UI **só lê do SQLite**, nunca de chamada de rede.
2. **Toda escrita sincronizável = dado + outbox na MESMA transação** (`withTransaction`).
3. **Supabase é futuro e fica atrás de ports.** Nenhum código fora de `infra/` ou `core/network|sync` pode saber que o Supabase existe.
4. **Domínio puro.** `domain/` não importa React, Expo, Drizzle, SQLite nem Supabase.
5. **Mudança estrutural e mudança funcional em commits separados.** Use `git mv` ao mover arquivos.
6. Antes de concluir qualquer tarefa: `npx tsc --noEmit`, `npm test` e `npx eslint .` devem passar.

---

## 2. Estrutura de pastas

```
src/
├── app/            # SOMENTE rotas Expo Router. Cada rota renderiza <XScreen /> e nada mais.
├── features/<feature>/
│   ├── domain/         # entidades, regras puras, ports (interfaces)
│   ├── application/    # use cases (orquestração)
│   ├── infra/          # schema, repositório SQLite, mapper, remote (Supabase)
│   ├── presentation/   # screens/, components/, hooks/
│   ├── testing/        # fakes e factories da feature
│   └── index.ts        # API pública (único ponto de entrada externo)
├── core/           # transversal: db/, sync/, network/, simulation/, di/, result.ts, utils/
├── ui/             # Design System genérico: tokens/, primitives/, feedback/, overlays/, layout/, theme/
└── i18n/           # strings pt-BR
```

- Testes ao lado do código: `<camada>/__tests__/*.test.ts(x)`. Helpers em `testing/` (fora de `__tests__`).
- Aliases obrigatórios: `@/*`, `@features/*`, `@core/*`, `@ui/*`. **Proibido** `../../../`.

---

## 3. Regra de dependência

```
presentation → application → domain ← infra
```

| Camada | Pode importar | Proibido |
|---|---|---|
| `domain` | `domain`, `core/result`, `core/utils` | React, Drizzle, expo-*, Supabase |
| `application` | `domain` (ports), `core/result` | `infra`, `presentation`, SQLite |
| `infra` | `domain`, `core/db`, `core/sync`, `core/network` | `presentation`, `application` |
| `presentation` | `application`, `ui`, `core`, tipos do `domain` | `infra` direto |
| `features/A` → `features/B` | **só** `features/B/index.ts` | caminhos internos de B |
| `core` | outros módulos `core` | `features`, `ui` |
| `ui` | `ui`, `core/utils` | `features`, `core/db`, `core/sync` |

- Composição entre features acontece em `features/today/` ou na rota, nunca dentro de outra feature.
- Instanciação de repositórios e use cases **somente** em `core/di/`. Nunca `new XSqliteRepository()` em tela ou hook.
- Violações são erro de lint (`eslint-plugin-boundaries`). Não desative a regra para "fazer passar".

---

## 4. Dados: SQLite offline-first

- "Offline" = **SQLite persistente no dispositivo** via `expo-sqlite` (+ Drizzle). Banco **em memória** é usado **apenas em testes**.
- Toda tabela sincronizável tem: `id` (**UUID v7 gerado no cliente**, sem autoincrement), `farm_id`, `created_at`, `updated_at`, `deleted_at` (soft delete), `version`/`server_rev`.
- **Nunca** `DELETE` físico em tabela sincronizável: use `deleted_at`.
- Índices em `farm_id`, `updated_at`, `deleted_at` e colunas de filtro.
- Alterações de schema **sempre via migration**; nunca editar migration já aplicada.
- **Estoque de doses e saldos: registrar movimentações** e derivar o saldo. Nunca sobrescrever um número.
- Queries reativas (`useLiveQuery`) nos hooks de leitura para a UI refletir o pull do sync.
- Datas em ISO 8601 UTC no banco; formatação só na apresentação.
- Paginação por cursor direto no SQLite; nada de carregar tabelas inteiras em memória.

### Use case de escrita (padrão)
```ts
await tx.run(async () => {
  await repo.save(entity);                                  // port
  await outbox.enqueue(toOutboxOp('insemination.create', entity)); // operation_id único
});
```
Validação de regra acontece na entidade (`Entity.create`) e retorna `Result<T, AppError>`. Use cases **não lançam** para erro de negócio.

---

## 5. Supabase (preparação para o futuro)

Enquanto não integrado, **não instale nem importe `@supabase/supabase-js`** fora do escopo abaixo. Prepare o terreno:

- Cada feature expõe um port remoto em `domain/` (ex.: `AnimalRemoteGateway`) e uma implementação em `infra/*.remote.ts`. Hoje pode ser um *noop/fake*.
- O motor de sync (`core/sync`) fala **apenas** com os ports/`core/network/api-client`, nunca com o SDK direto.
- Sync em dois passos: **push** (drena outbox, em lote, idempotente por `operation_id`) e **pull** (por cursor `updated_at`/`server_rev`).
- Política de conflito explícita por entidade (documentar em `docs/sync-conflicts.md`): *last-write-wins por campo* para dados simples; *server-wins* para dados críticos.
- Multi-tenant por `farm_id`; o servidor imporá isso com **RLS**. O cliente nunca confia só no filtro local.
- Sessão/tokens em `expo-secure-store`, **nunca** em AsyncStorage ou SQLite.
- Variáveis: só `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`. **Jamais** colocar `service_role` no app.
- Nomes de colunas locais em `snake_case`, compatíveis com as tabelas remotas, para o mapeamento ser trivial.

---

## 6. UI: NativeWind (Tailwind)

- Estilização **exclusivamente via `className`** (NativeWind). Evite `StyleSheet.create` e `style={{}}`, exceto para valores dinâmicos que o Tailwind não cobre (ex.: transform animado, medidas calculadas).
- **Sem valores soltos**: nada de `#hex`, `px` arbitrário (`w-[137px]`) ou cores literais em telas e features. Use tokens do `tailwind.config.js`, que espelham `ui/tokens/`.
- Cores **semânticas**: `bg-surface`, `text-on-surface`, `bg-danger`, `bg-warning`, `bg-success`, `bg-sync-pending`. Nunca `bg-green-500` direto em componente de feature.
- **Dark mode** via tokens/`dark:`; todo componente novo precisa funcionar nos dois temas.
- Variantes via `tailwind-variants` ou `cva` (`variant`, `size`, `loading`, `disabled`). Proibido montar classe com concatenação de strings condicionais espalhadas.
- Classes dinâmicas **completas** no código (`'bg-danger'`), nunca interpoladas (`` `bg-${cor}` ``), pois o Tailwind não as detecta.
- Use um único `Screen` (`ui/layout`) com SafeArea, KeyboardAvoidingView e scroll padronizados.

### Componentes
- **Apresentação** (props → JSX, sem I/O) separada de **hook/container** (dados e ações).
- `ui/` é genérico: sem regra de negócio, sem import de `features`. Componente ligado ao domínio mora na `presentation/` da feature.
- Lógica fora do JSX: telas finas, regras em hooks e use cases.
- `React.memo` em itens de lista e callbacks estáveis (`useCallback`).

### Estados obrigatórios em toda tela
Loading (skeleton, não spinner de tela cheia), **vazio** (com ação), **erro** (com retry) e **offline/sincronizando**. Registros pendentes na outbox mostram indicador discreto "pendente de envio".

### Listas
`FlashList` para rebanho, touros e históricos; `keyExtractor` com UUID; paginação por cursor.

### Formulários
`react-hook-form` + `zod`. Configure `inputMode`/`keyboardType`, `returnKeyType`, foco encadeado e erro inline. Formulários longos como **rota modal do Expo Router** ou bottom sheet.

### Acessibilidade e uso em campo
- Alvo de toque **≥ 48 dp** (56 dp nas ações principais: uso com luva e sol forte).
- `accessibilityRole`, `accessibilityLabel`, `accessibilityState` nos primitivos.
- **Nunca só cor** para status: sempre ícone ou texto junto (`SeloStatus`).
- Contraste alto; respeitar fonte dinâmica; `expo-haptics` em confirmações.

---

## 7. Ícones: Lucide

- Biblioteca única: **`lucide-react-native`** (requer `react-native-svg`). **Proibido** misturar com `@expo/vector-icons`, emojis ou PNG como ícone de UI.
- Import **nomeado**, nunca o pacote inteiro: `import { Syringe } from 'lucide-react-native'`.
- Use sempre o wrapper `ui/primitives/Icon.tsx`, que:
  - registra `cssInterop` para aceitar `className` (cor via `text-*`);
  - aplica tamanhos padronizados: `sm=16`, `md=20`, `lg=24`, `xl=32`;
  - exige `accessibilityLabel` quando o ícone **não** for decorativo; decorativos usam `accessibilityElementsHidden`/`importantForAccessibility="no"`.
- Cor sempre por token semântico (`text-on-surface`, `text-danger`), não por prop `color="#..."`.
- Ícone isolado clicável precisa de área de toque ≥ 48 dp (use `Pressable` + `hitSlop` ou `Botao` variante `icon`).
- Mapa de ícones de domínio centralizado em `ui/icons.ts` (ex.: `inseminacao → Syringe`, `rebanho → Beef`/`Milk`, `alerta → TriangleAlert`, `sync → RefreshCw`, `offline → WifiOff`) para manter consistência.

---

## 8. Nomenclatura e idioma

- **Código em inglês** (`Herd`, `Bull`, `Insemination`, `Animal`); **interface em pt-BR** via `i18n/`. Sem string de UI hardcoded em componente.
- Arquivos `kebab-case` (`register-animal.usecase.ts`); componentes `PascalCase.tsx`.
- Sufixos: `.entity.ts`, `.repository.ts` (port), `.sqlite.repository.ts`, `.remote.ts`, `.usecase.ts`, `.mapper.ts`, `.schema.ts`.
- Componentes legados em português permanecem até a fase de padronização; renomear apenas em commit isolado.

---

## 9. Testes

- `domain`: unitário puro, sem mocks. `application`: ports **in-memory**, sem SQLite. `infra`: **teste de contrato** (mesma suíte contra in-memory e SQLite). `core/sync`: offline, reenvio duplicado, conflito, falha parcial, backoff (fake clock e fake API).
- Componentes e hooks com React Native Testing Library, consultando por `role`/`label`.
- Cobertura mínima: `domain` ≥ 90%, `application` ≥ 80%.
- Toda correção de bug começa com um teste que falha.

---

## 10. Checklist antes de finalizar uma tarefa

- [ ] Respeita a regra de dependência (seção 3) e o lint passa.
- [ ] Escrita sincronizável usa use case + transação + outbox.
- [ ] Nada de acesso à rede a partir da UI; leitura vem do SQLite.
- [ ] Estilo só com tokens/`className`; ícones só via `Icon` (Lucide).
- [ ] Estados loading/vazio/erro/offline tratados.
- [ ] Alvos de toque e acessibilidade verificados.
- [ ] Testes escritos/atualizados; `tsc`, `jest` e `eslint` verdes.
- [ ] Sem arquivos órfãos, shims de reexport ou imports pelo caminho antigo.

## 11. Nunca faça

- Importar `infra` a partir de `presentation`/`application`, ou internos de outra feature.
- `DELETE` físico, ID autoincrement ou sobrescrita de saldo em dados sincronizáveis.
- Chamar Supabase/`fetch` direto de tela, hook de UI ou use case.
- Cores/tamanhos literais, `StyleSheet` por padrão, ícones fora do Lucide.
- Alterar comportamento durante uma refatoração estrutural.
- Apagar arquivos fora do escopo pedido sem confirmar.