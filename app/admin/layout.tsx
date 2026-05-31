'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { MatchProvider, useMatch } from '@/contexts/MatchContext';
import { MATCHES } from '@/constants/matches';
import { useAdminAuth } from '@/lib/firebase/adminAuth';

function MatchTabs() {
  const { matchId, setMatchId } = useMatch();
  return (
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mx-4 mb-3">
      {Object.values(MATCHES).map((m) => (
        <button
          key={m.id}
          onClick={() => setMatchId(m.id)}
          className={`flex-1 rounded py-1.5 text-xs font-semibold transition-colors ${
            matchId === m.id ? 'bg-white text-korea-red shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {m.label} {m.awayTeamFlag}
        </button>
      ))}
    </div>
  );
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const { status, claims, error, login, logout } = useAdminAuth();
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim() || !phone.trim()) return;
    await login({ name: name.trim(), employeeId: employeeId.trim(), phone: phone.trim() });
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-sm text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin" />
        관리자 권한을 확인하는 중...
      </div>
    );
  }

  if (status !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-korea-red/10 mb-2">
              <Lock className="h-6 w-6 text-korea-red" />
            </div>
            <CardTitle className="text-center">운영자 전용</CardTitle>
            <p className="text-xs text-muted-foreground text-center">등록된 이름, 사번, 전화번호로 로그인해주세요</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                autoComplete="name"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
              />
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="사번 (예: 1113677)"
                autoComplete="username"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="전화번호 (예: 01094074295)"
                autoComplete="tel"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
              />
              {error && <p className="text-center text-xs text-red-500">{error}</p>}
              {status === 'not-admin' && !error && (
                <p className="text-center text-xs text-red-500">운영자/관리자 권한이 없는 계정입니다.</p>
              )}
              <Button type="submit" variant="korea" className="w-full" disabled={!name.trim() || !employeeId.trim() || !phone.trim()}>
                로그인
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-korea-red" />
          <span className="font-bold text-sm">운영자 모드</span>
          {claims?.name && (
            <span className="text-xs text-muted-foreground">
              {claims.name}
              {claims.roleLabel && claims.role !== 'member' && (
                <span className="ml-1 text-korea-red">({claims.roleLabel})</span>
              )}
            </span>
          )}
          <Button
            variant="ghost" size="sm"
            className="ml-auto text-xs text-muted-foreground"
            onClick={() => { void logout(); }}
          >
            로그아웃
          </Button>
        </div>
        <MatchTabs />
      </div>
      <div className="mx-auto max-w-lg px-4 pb-16 pt-4">
        {children}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <MatchProvider>
      <AdminContent>{children}</AdminContent>
    </MatchProvider>
  );
}
