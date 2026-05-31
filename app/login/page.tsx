'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithToken } from '@/lib/firebase/auth';

interface AuthResponse {
  customToken?: string;
  name?: string;
  role?: string;
  roleLabel?: string;
  error?: string;
}

async function postAuth(payload: Record<string, string>) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as AuthResponse;
  if (!res.ok || !data.customToken) {
    throw new Error(data.error ?? '인증 처리 중 오류가 발생했습니다.');
  }
  return data.customToken;
}

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim() && employeeId.trim() && phone.trim();

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setError(null);
    setLoading(true);
    try {
      const customToken = await postAuth({
        name: name.trim(),
        employeeId: employeeId.trim(),
        phone: phone.replace(/[^0-9]/g, '').trim(),
      });

      await signInWithToken(customToken);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-sm">
        <Button variant="ghost" size="sm" asChild className="mb-4 px-0 text-muted-foreground">
          <Link href="/">
            <ChevronLeft className="mr-1 h-4 w-4" />
            홈으로
          </Link>
        </Button>

        <Card>
          <CardHeader className="items-center pb-3 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-korea-red/10">
              <ShieldCheck className="h-6 w-6 text-korea-red" />
            </div>
            <CardTitle>직원 인증 로그인</CardTitle>
            <p className="text-xs text-muted-foreground">
              등록된 이름, 사번, 전화번호가 모두 일치하면 바로 로그인됩니다.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                inputMode="numeric"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="사번"
                autoComplete="username"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
              />
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="전화번호 (예: 01012345678)"
                autoComplete="tel"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-korea-red/30"
              />

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600">{error}</p>}

              <Button type="submit" variant="korea" className="w-full" disabled={!canSubmit || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                직원 인증 후 로그인
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
