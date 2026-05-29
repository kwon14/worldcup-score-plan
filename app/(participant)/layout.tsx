'use client';

import { MatchProvider, useMatch } from '@/contexts/MatchContext';
import { MATCHES } from '@/constants/matches';
import type { ReactNode } from 'react';

function MatchTabs() {
  const { matchId, setMatchId } = useMatch();
  return (
    <div className="flex gap-1.5 rounded-xl bg-muted p-1 mb-4">
      {Object.values(MATCHES).map((m) => (
        <button
          key={m.id}
          onClick={() => setMatchId(m.id)}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            matchId === m.id
              ? 'bg-white text-korea-red shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {m.label} {m.awayTeamFlag}
        </button>
      ))}
    </div>
  );
}

function ParticipantLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MatchTabs />
      {children}
    </>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MatchProvider>
      <ParticipantLayout>{children}</ParticipantLayout>
    </MatchProvider>
  );
}
