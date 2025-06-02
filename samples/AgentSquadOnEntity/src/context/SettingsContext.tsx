import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

export interface SettingsData {
  agentWebsocketUrl: string;
  agentApiKey: string;
  userId: string;
  documentId: string;
  tenantId: string;
}

interface SettingsContextValue {
  settings: SettingsData;
  updateSettings: (newSettings: Partial<SettingsData>) => void;
}

const defaultSettings: SettingsData = {
  agentWebsocketUrl: '',
  agentApiKey: '',
  userId: '',
  documentId: '',
  tenantId: '',
};

const STORAGE_KEY = 'agent-settings';

// Function to load settings from localStorage
const loadSettingsFromStorage = (): SettingsData => {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      console.log('Loaded settings from localStorage:', parsedSettings);
      return { ...defaultSettings, ...parsedSettings };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }
  console.log('No saved settings found, using defaults');
  return defaultSettings;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state directly from localStorage
  const [settings, setSettings] = useState<SettingsData>(() => loadSettingsFromStorage());
  const isInitialMount = useRef(true);

  // Save settings to localStorage whenever they change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Don't save on initial mount since we just loaded from storage
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      console.log('Settings saved to localStorage:', settings);
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<SettingsData>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value: SettingsContextValue = {
    settings,
    updateSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}; 