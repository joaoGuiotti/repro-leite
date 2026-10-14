import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  getRealTodayDateString,
  advanceDays as domainAdvanceDays,
  isSimulatedDate,
  parseDateString,
} from './date-simulation';
import { getExpoDatabase, DEFAULT_FARM_ID } from '@core/db';
import { generateId } from '@core/utils/id';

export interface ManagementDateContextType {
  activeDateString: string;
  activeDate: Date;
  isSimulated: boolean;
  advanceDays: (days: number) => void;
  setDateString: (dateStr: string) => void;
  resetToToday: () => void;
}

const ManagementDateContext = createContext<ManagementDateContextType | null>(null);

const SETTING_KEY = 'simulated_management_date';

function loadSimulatedDateFromDb(): string | null {
  try {
    const rawDb = getExpoDatabase();
    if (typeof rawDb.getAllSync === 'function') {
      const rows = rawDb.getAllSync<{ value: string }>(
        'SELECT value FROM settings WHERE farm_id = ? AND key = ? AND deleted_at IS NULL LIMIT 1;',
        [DEFAULT_FARM_ID, SETTING_KEY]
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0].value;
      }
    }
  } catch {
    // Fallback silencioso se o banco ainda não estiver pronto
  }
  return null;
}

function saveSimulatedDateToDb(newDateStr: string): void {
  try {
    const rawDb = getExpoDatabase();
    const now = new Date().toISOString();
    const id = generateId();
    rawDb.runSync(
      `INSERT INTO settings (id, farm_id, key, value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(farm_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, deleted_at = NULL;`,
      [id, DEFAULT_FARM_ID, SETTING_KEY, newDateStr, now, now]
    );
  } catch {
    // Fallback silencioso
  }
}

export function ManagementDateProvider({ children }: { children: ReactNode }) {
  const [activeDateString, setActiveDateStringState] = useState<string>(
    () => loadSimulatedDateFromDb() || getRealTodayDateString()
  );

  const updateDate = (newDateStr: string) => {
    setActiveDateStringState(newDateStr);
    saveSimulatedDateToDb(newDateStr);
  };

  const advanceDays = (days: number) => {
    const nextDate = domainAdvanceDays(activeDateString, days);
    updateDate(nextDate);
  };

  const setDateString = (dateStr: string) => {
    updateDate(dateStr);
  };

  const resetToToday = () => {
    const today = getRealTodayDateString();
    updateDate(today);
  };

  const value: ManagementDateContextType = {
    activeDateString,
    activeDate: parseDateString(activeDateString),
    isSimulated: isSimulatedDate(activeDateString),
    advanceDays,
    setDateString,
    resetToToday,
  };

  return (
    <ManagementDateContext.Provider value={value}>
      {children}
    </ManagementDateContext.Provider>
  );
}

export function useManagementDate(): ManagementDateContextType {
  const context = useContext(ManagementDateContext);
  if (!context) {
    throw new Error('useManagementDate must be used within a ManagementDateProvider');
  }
  return context;
}
