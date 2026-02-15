import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

interface CreditsContextType {
  credits: number;
  loading: boolean;
  refreshCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(true);

  const fetchCredits = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await api.get('/credits/balance');
      if (data && typeof data.credits === 'number') {
        setCredits(data.credits);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching credits:', error);
      setLoading(false);
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    await fetchCredits();
  }, [fetchCredits]);

  // Initial fetch
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Auto-refresh every 3 seconds for immediate updates
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      fetchCredits();
    }, 3000); // 3 seconds - fast polling for immediate credit updates

    return () => clearInterval(interval);
  }, [isPolling, fetchCredits]);

  return (
    <CreditsContext.Provider value={{ credits, loading, refreshCredits }}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
};
