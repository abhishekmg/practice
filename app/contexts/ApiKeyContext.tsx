'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const STORAGE_KEY = 'practice_google_api_key';

interface ApiKeyContextType {
  /** User's Google (Gemini) API key, or null if not set. Never expose raw key in UI. */
  googleApiKey: string | null;
  /** True if user has provided and saved an API key */
  hasUserApiKey: boolean;
  /** Set and persist the API key. Pass null to clear. */
  setGoogleApiKey: (key: string | null) => void;
  /** Masked key for "saved" indication only (e.g. "••••••••xyz1") */
  maskedKeyHint: string | null;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [googleApiKey, setGoogleApiKeyState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      setGoogleApiKeyState(raw ?? null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const setGoogleApiKey = useCallback((key: string | null) => {
    if (typeof window === 'undefined') return;
    if (key === null || key.trim() === '') {
      localStorage.removeItem(STORAGE_KEY);
      setGoogleApiKeyState(null);
    } else {
      const trimmed = key.trim();
      localStorage.setItem(STORAGE_KEY, trimmed);
      setGoogleApiKeyState(trimmed);
    }
  }, []);

  const maskedKeyHint = googleApiKey
    ? `••••••••${googleApiKey.slice(-4)}`
    : null;

  const value: ApiKeyContextType = {
    googleApiKey: hydrated ? googleApiKey : null,
    hasUserApiKey: Boolean(googleApiKey && googleApiKey.length > 0),
    setGoogleApiKey,
    maskedKeyHint,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
