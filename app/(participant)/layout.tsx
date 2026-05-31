'use client';

import { MatchProvider, useMatch } from '@/contexts/MatchContext';
import { MATCHES } from '@/constants/matches';
import type { ReactNode } from 'react';
import { useParticipantAuth } from '@/lib/firebase/auth';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

function UserBar() {
  const { status, claims, logout } = useParticipantAuth();

  if (status === 'loading') return null;

  if (status === 'signed-out') {
    return (
      <div className="flex items-center justify-end mb-3 px-0.5">
        <Link href="/login" className="text-xs text-korea-red font-medium hover:underline">
          로그인 / 회원가입
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between mb-3 px-0.5">
      <span className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{claims?.name}</span> 님
        {claims?.roleLabel && claims.role !== 'member' && (
          <span className="ml-1 text-korea-red">({claims.roleLabel})</span>
        )}
      </span>
      <button
        onClick={() => void logout()}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOut className="h-3 w-3" />
        로그아웃
      </button>
    </div>
  );
}

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
      <UserBar />
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
