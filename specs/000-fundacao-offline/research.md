# Phase 0 Research: Fundação Offline & Infraestrutura Core

**Feature**: `000-fundacao-offline`  
**Date**: 2026-10-13  
**Status**: Completed

Este documento consolida as decisões técnicas e padrões de arquitetura para a infraestrutura core do aplicativo móvel **ReproLeite**, em estrita conformidade com a Constituição do Projeto.

---

## 1. Banco de Dados Local & ORM

### Decisão
Utilizar **`expo-sqlite` (versão moderna/Next)** em conjunto com **`drizzle-orm`** e **`drizzle-kit`**.

### Racional
- **Offline-First Absoluto**: O SQLite local embutido garante persistência permanente e instantânea no dispositivo (leitura/escrita em < 10ms), eliminando qualquer dependência de conectividade.
- **Tipagem Forte e Migrações**: O Drizzle ORM oferece schemas TypeScript rigorosamente tipados, zero overhead de abstrações pesadas, suporte nativo a migrações versionadas no SQLite e compatibilidade comprovada com o `expo-sqlite`.
- **Prevenção de Perda de Dados**: Ao contrário do IndexedDB em navegadores móveis (que o iOS pode purgar quando o armazenamento fica escasso), o SQLite nativo em app empacotado reside no diretório protegido do aplicativo.

### Alternativas Avaliadas
- **WatermelonDB**: Excelente para coleções gigantescas, porém exige configuração nativa pesada, decorators legados e complexidade excessiva para o volume do MVP (~200 animais).
- **TypeORM / Prisma**: Muito pesados ou com suporte instável para o runtime React Native/Expo moderno.
- **AsyncStorage puro**: Inadequado para consultas relacionais, filtros complexos e integridade referencial.

---

## 2. Gerenciamento da Data de Manejo & Estado do Simulador

### Decisão
Implementar o estado da **Data de Manejo** através de um **`ManagementDateContext`** em React com persistência de fallback na tabela `settings` do SQLite local, acompanhado de funções utilitárias puras em `src/domain/dateSimulation.ts` (usando `date-fns`).

### Racional
- Todas as telas de manejo (alertas de cio aos 21 dias, toques aos 45 dias, cronograma de cortes de leite) consomem a data ativa do sistema.
- O simulador precisa propagar re-renderizações instantâneas (< 100ms) quando o usuário clica em `+1d`, `+7d` ou `+21d`.
- As datas zootécnicas são manipuladas e persistidas estritamente como strings `YYYY-MM-DD` (sem timezone e sem hora) para prevenir distorções causadas por fuso horário ou horário de verão.

### Alternativas Avaliadas
- **Recalcular a partir do relógio do aparelho (`new Date()`) diretamente em cada componente**: Inviabilizaria a capacidade de simulação temporal e planejamento zootécnico futuro pelo gestor da fazenda.
- **Redux / Redux Toolkit**: Overhead desnecessário de boilerplate para uma aplicação com escopo enxuto e orientado a SQLite local.

---

## 3. Estado de Proteção e Sincronização (Sync Simulator & Status)

### Decisão
Implementar um **`SyncStatusContext`** desacoplado da rede real, alimentado pela leitura da tabela local `sync_queue` e com uma flag em memória `isSimulatedOffline`.

### Racional
- O cabeçalho precisa refletir dinamicamente:
  - 🟢 **Protegido**: quando `sync_queue` estiver vazia (`count == 0`) e última sincronização recente.
  - 🟡 **Pendente (Modo Curral)**: quando houver registros pendentes em `sync_queue` (`count > 0`), exibindo o número exato de alterações guardadas localmente.
  - 🔵 **Sincronizando**: durante a execução do lote de envio assíncrono.
- A flag `isSimulatedOffline` permite forçar o aplicativo a ignorar a conexão ativa durante demonstrações e testes em bancada, validando o isolamento do Modo Curral.

---

## 4. Identificadores, Concorrência e Soft Delete

### Decisão
- **Identificadores**: Geração de chaves primárias em **UUID v4** no próprio dispositivo (`Crypto.randomUUID()` nativo do Expo / `uuid`).
- **Timestamps**: `created_at` e `updated_at` armazenados em formato ISO 8601 UTC string.
- **Resolução de Conflitos**: Estratégia **Last-Write-Wins (LWW)** baseada na comparação de `updated_at`.
- **Soft Delete**: Coluna `deleted_at: text | null`. Consultas ativas filtram automaticamente `deleted_at IS NULL`. A remoção física no banco local só ocorre após confirmação de propagação de tombstones ou em limpezas programadas.

### Racional
Garante que múltiplos dispositivos possam criar dados simultaneamente no campo sem chaves duplicadas e sem perdas de integridade ao sincronizar.

---

## 5. Design System e Ergonomia Rural (NativeWind v4)

### Decisão
Utilizar tokens centrais no `tailwind.config.js` mapeando para classes utilitárias em componentes primitivos em `src/ui/`:
- Botões primários com classe `min-h-14` (56px) para evitar cliques acidentais.
- Controles secundários e campos numéricos com `min-h-12` (48px).
- Paleta de alto contraste sob sol forte:
  - Fundo principal claro: `#f8fafc` / `#ffffff`
  - Verde Pasto Principal: `#1b4332` (Pasto 900) e `#2d6a4f` (Pasto 700)
  - Alertas Âmbar: `#b45309` (Aviso 700) sobre fundo âmbar suave `#fef3c7`
  - Textos vitais: `#0f172a` (Slate 900), garantindo contraste WCAG acima de 7:1.

---

## Conclusão
Todas as decisões respeitam a Constituição do Projeto, não introduzem bibliotecas pesadas e estabelecem a base sólida necessária para as próximas features de cadastro, reprodução e aleitamento.
