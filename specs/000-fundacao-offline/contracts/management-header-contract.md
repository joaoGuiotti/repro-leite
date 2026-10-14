# Contract: Cabeçalho de Manejo e Simulador de Tempo

**Componente**: `CabecalhoStatusSimulador`  
**Caminho Previsto**: `src/ui/CabecalhoStatusSimulador.tsx`  
**Escopo**: Exibição da data de manejo ativa, atalhos de avanço temporal, estado de sincronização em tempo real e controles de simulação.

---

## 1. Interface de Propriedades (Props)

```typescript
export interface CabecalhoStatusSimuladorProps {
  /** Se deve renderizar em modo compacto para telas com rolagem densa */
  compact?: boolean;
  /** Callback opcional acionado quando o usuário clica para abrir o seletor detalhado de data */
  onOpenDatePicker?: () => void;
}
```

---

## 2. Contrato de Estado Consumido (`useManagementDate` & `useSyncStatus`)

O componente consome dois contextos globais:

### `useManagementDate`
```typescript
export interface ManagementDateState {
  /** Data de manejo ativa formatada como YYYY-MM-DD */
  activeDateString: string;
  /** Objeto Date correspondente à data ativa */
  activeDate: Date;
  /** Se a data ativa difere da data real do calendário */
  isSimulated: boolean;
  /** Avança N dias a partir da data atualmente ativa */
  advanceDays: (days: number) => void;
  /** Define uma data arbitrária (string YYYY-MM-DD) */
  setDateString: (dateStr: string) => void;
  /** Reseta a data ativa para a data real de hoje */
  resetToToday: () => void;
}
```

### `useSyncStatus`
```typescript
export type SyncProtectionState = 'protected' | 'pending' | 'syncing' | 'error';

export interface SyncStatusState {
  /** Estado consolidado de proteção */
  state: SyncProtectionState;
  /** Quantidade de alterações na fila local pendentes de envio */
  pendingCount: number;
  /** Timestamp ou string legível da última sincronização bem-sucedida */
  lastSyncedDescription: string;
  /** Se o modo curral simulado (sem internet forçado) está ativo */
  isSimulatedOffline: boolean;
  /** Alterna o modo curral simulado */
  toggleSimulatedOffline: () => void;
  /** Dispara a sincronização manual imediata */
  triggerSyncNow: () => Promise<void>;
}
```

---

## 3. Elementos Interativos e Comportamento Visual

| Elemento | Ação do Usuário | Resultado Visual / Sistema |
| :--- | :--- | :--- |
| **Badge da Data** | Toque | Abre modal ou seletor de data para escolha arbitrária de calendário |
| **Botão `+1d`** | Toque | Incrementa a data em 1 dia; recalcula os quadros da tela |
| **Botão `+7d`** | Toque | Incrementa a data em 7 dias; recalcula os quadros da tela |
| **Botão `+21d`** | Toque | Incrementa a data em 21 dias (janela de retorno de cio) |
| **Botão `Resetar Hoje`** | Toque | Restaura a data para a data real do dispositivo |
| **Selo 🟢 Nuvem Protegida** | Visual | Informa que todos os dados foram replicados na nuvem |
| **Selo 🟡 Modo Curral** | Visual | Exibe o contador de alterações locais pendentes de envio |
| **Selo 🔵 Sincronizando** | Visual | Spinner de rotação indicando processo ativo |
| **Botão "Sincronizar Agora"** | Toque | Dispara rotina de sincronização se não estiver em modo offline forçado |
| **Switch "Sem Internet"** | Alternância | Desconecta emuladamente as chamadas de rede para testes de campo |
