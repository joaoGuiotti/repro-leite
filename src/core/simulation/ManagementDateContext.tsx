import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getRealTodayDateString,
  advanceDays as domainAdvanceDays,
  isSimulatedDate,
  parseDateString,
} from './date-simulation';
import { SettingsRepository } from '@/db/repositories/settingsRepository';
import { DEFAULT_FARM_ID } from '@/db/client';

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

export function ManagementDateProvider({ children }: { children: ReactNode }) {
  const [activeDateString, setActiveDateStringState] = useState<string>(getRealTodayDateString());

  // Carrega persistência inicial do SQLite
  useEffect(() => {
    let isMounted = true;
    async function loadPersistedDate() {
      try {
        const persisted = await SettingsRepository.getSetting(DEFAULT_FARM_ID, SETTING_KEY);
        if (isMounted && persisted) {
          setActiveDateStringState(persisted);
        }
      } catch {
        // Fallback silencioso para data de hoje se o banco ainda não estiver pronto
      }
    }
    loadPersistedDate();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateDate = (newDateStr: string) => {
    setActiveDateStringState(newDateStr);
    SettingsRepository.setSetting(DEFAULT_FARM_ID, SETTING_KEY, newDateStr).catch(() => {});
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
