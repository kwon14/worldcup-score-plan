'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { MATCHES, DEFAULT_MATCH_ID, type MatchConfig } from '@/constants/matches';

const STORAGE_KEY = 'wc_match_id';

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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && MATCHES[saved]) setMatchIdState(saved);
  }, []);

  function setMatchId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
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
