'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Lock } from 'lucide-react';

// TODO: 환경변수 기반 or Firebase Auth로 교체
const ADMIN_PIN = '1234';
const SESSION_KEY = 'admin_authed';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') setAuthed(true);
  }, []);

  function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-korea-red/10 mb-2">
              <Lock className="h-6 w-6 text-korea-red" />
            </div>
            <CardTitle className="text-center">운영자 전용</CardTitle>
            <p className="text-xs text-muted-foreground text-center">PIN을 입력해주세요</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(false); }}
                placeholder="PIN 번호"
                maxLength={8}
                className={`w-full rounded-lg border px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-korea-red/30 ${
                  error ? 'border-red-400 bg-red-50' : ''
                }`}
              />
              {error && <p className="text-center text-xs text-red-500">PIN이 올바르지 않아요</p>}
              <Button type="submit" variant="korea" className="w-full">입장</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 어드민 상단 바 */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-white px-4 py-3 shadow-sm">
        <ShieldCheck className="h-5 w-5 text-korea-red" />
        <span className="font-bold text-sm">운영자 모드</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-xs text-muted-foreground"
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
        >
          로그아웃
        </Button>
      </div>
      <div className="mx-auto max-w-lg px-4 pb-16 pt-4">
        {children}
      </div>
    </div>
  );
}
