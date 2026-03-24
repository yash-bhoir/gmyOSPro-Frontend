import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '@/utils/storage';
import api from '@/services/api';

interface Gym {
  _id: string;
  name: string;
  slug: string;
  city?: string;
  phone?: string;
  address?: string;
  planTier: string;
  planStatus: string;
  isSetupComplete: boolean;
  trialEndsAt?: string;
}

interface AppState {
  gym: Gym | null;
  gymId: string | null;
  isLoadingGym: boolean;
  setGym: (gym: Gym) => void;
  refreshGym: () => Promise<void>;
  clearGym: () => void;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [gym, setGymState]         = useState<Gym | null>(null);
  const [isLoadingGym, setLoading] = useState(false);

  const refreshGym = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/gyms/my');
      if (data.data) {
        setGymState(data.data);
        await storage.set('gymos_gym', JSON.stringify(data.data));
      }
    } catch {} finally { setLoading(false); }
  }, []);

  const setGym = useCallback((g: Gym) => {
    setGymState(g);
    storage.set('gymos_gym', JSON.stringify(g));
  }, []);

  const clearGym = useCallback(() => {
    setGymState(null);
    storage.remove('gymos_gym');
  }, []);

  // Restore gym from storage on app start
  useEffect(() => {
    storage.get('gymos_gym').then((raw) => {
      if (raw) {
        try { setGymState(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  return (
    <AppContext.Provider value={{
      gym,
      gymId: gym?._id || null,
      isLoadingGym,
      setGym,
      refreshGym,
      clearGym,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppState => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};