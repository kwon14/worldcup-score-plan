'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { MATCHES, DEFAULT_MATCH_ID, type MatchConfig } from '@/constants/matches';

const STORAGE_KEY = 'wc_match_id';
const STORAGE_VERSION_KEY = 'wc_match_id_version';
const STORAGE_VERSION = '2026-06-south-africa-default';

interface MatchContextValue {
  matchId: string;
  match: MatchConfig;
  setMatchId: (id: string) => void;
}

const MatchContext = createContext<MatchContextValue>({
  matchId: DEFAULT_MATCH_ID,
  match: MATCHES[DEFAULT_MATCH_ID],
  setMatchId: () => {},
});

export function MatchProvider({ children }: { children: ReactNode }) {
  const [matchId, setMatchIdState] = useState(DEFAULT_MATCH_ID);

  useEffect(() => {
    const storageVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    const saved = localStorage.getItem(STORAGE_KEY);

    if (storageVersion !== STORAGE_VERSION) {
      localStorage.setItem(STORAGE_KEY, DEFAULT_MATCH_ID);
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
      setMatchIdState(DEFAULT_MATCH_ID);
      return;
    }

    if (saved && MATCHES[saved]) setMatchIdState(saved);
  }, []);

  function setMatchId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
    setMatchIdState(id);
  }

  return (
    <MatchContext.Provider value={{ matchId, match: MATCHES[matchId], setMatchId }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  return useContext(MatchContext);
}
