import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getDatabase, getExpoDatabase, DEFAULT_FARM_ID, DEFAULT_FARM_NAME, schema } from '@core/db';
import { eq } from 'drizzle-orm';
import { OutboxRepository } from '@core/sync/outbox.repository';
import { syncEngine } from '@core/sync/sync-engine';

export interface FarmContextType {
  farmId: string;
  farmName: string;
  updateFarmName: (name: string) => Promise<boolean>;
  refreshFarm: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | null>(null);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farmId, setFarmId] = useState<string>(DEFAULT_FARM_ID);
  const [farmName, setFarmName] = useState<string>(DEFAULT_FARM_NAME);

  const refreshFarm = useCallback(async () => {
    try {
      const rawDb = getExpoDatabase();
      const row = rawDb.getFirstSync(
        'SELECT id, name FROM farms LIMIT 1;'
      ) as { id: string; name: string } | null;

      if (row && row.name) {
        setFarmId(row.id);
        setFarmName(row.name);
        if (row.id && syncEngine.farmId !== row.id) {
          syncEngine.setFarmId(row.id);
        }
      }
    } catch {
      // Silencioso se banco ainda estiver inicializando
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const rawDb = getExpoDatabase();
        const row = rawDb.getFirstSync(
          'SELECT id, name FROM farms LIMIT 1;'
        ) as { id: string; name: string } | null;

        if (isMounted && row && row.name) {
          setFarmId(row.id);
          setFarmName(row.name);
          if (row.id && syncEngine.farmId !== row.id) {
            syncEngine.setFarmId(row.id);
          }
        }
      } catch {
        // Silencioso se o banco de dados ainda estiver inicializando
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Atualiza automaticamente o nome e id da fazenda após sincronizações com o servidor
  useEffect(() => {
    const unsubscribe = syncEngine.addListener((status) => {
      if (!status.isSyncing) {
        void refreshFarm();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshFarm]);

  const updateFarmName = async (newName: string): Promise<boolean> => {
    const trimmed = newName.trim();
    if (!trimmed) return false;

    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      await db
        .update(schema.farms)
        .set({ name: trimmed, updatedAt: now })
        .where(eq(schema.farms.id, farmId));

      await OutboxRepository.enqueue({
        farmId,
        tableName: 'farms',
        recordId: farmId,
        operation: 'UPDATE',
        payloadJson: {
          id: farmId,
          name: trimmed,
          updated_at: now,
        },
      });

      setFarmName(trimmed);
      return true;
    } catch (err) {
      console.error('Erro ao atualizar nome da fazenda:', err);
      return false;
    }
  };

  return (
    <FarmContext.Provider value={{ farmId, farmName, updateFarmName, refreshFarm }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm(): FarmContextType {
  const context = useContext(FarmContext);
  if (!context) {
    return {
      farmId: DEFAULT_FARM_ID,
      farmName: DEFAULT_FARM_NAME,
      updateFarmName: async () => false,
      refreshFarm: async () => {},
    };
  }
  return context;
}
