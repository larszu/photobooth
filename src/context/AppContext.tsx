import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppState {
  mode: 'gallery' | 'single';
  setMode: (mode: 'gallery' | 'single') => void;
  lastPhoto: string | null;
  setLastPhoto: (filename: string | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'gallery' | 'single'>('gallery');
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);

  useEffect(() => {
    // Versuche API-Calls mit Fallback
    fetch('/api/mode')
      .then(res => res.json())
      .then(data => setMode(data.mode))
      .catch(err => {
        console.warn('Mode API not available, using default:', err);
        setMode('gallery');
      });
    
    fetch('/api/photos/last')
      .then(res => res.json())
      .then(data => setLastPhoto(data.filename))
      .catch(err => {
        console.warn('Last photo API not available:', err);
        setLastPhoto(null);
      });
  }, []);

  return (
    <AppContext.Provider value={{ mode, setMode, lastPhoto, setLastPhoto }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
