import { useCallback, useEffect, useState } from 'react';
import {
  getAuth,
  getIdTokenResult,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { app } from './config';

export type AdminAuthStatus = 'loading' | 'signed-out' | 'not-admin' | 'admin';

interface AdminAuthState {
  status: AdminAuthStatus;
  user: User | null;
  claims: { name?: string; role?: string; roleLabel?: string } | null;
  error: string | null;
  login(payload: { name: string; employeeId: string; phone: string }): Promise<void>;
  logout(): Promise<void>;
}

let authInstance: Auth | null = null;

function adminAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is only available in the browser');
  }
  authInstance ??= getAuth(app);
  return authInstance;
}

async function hasAdminClaim(user: User): Promise<boolean> {
  const { claims } = await getIdTokenResult(user, true);
  return claims.admin === true;
}

export function useAdminAuth(): AdminAuthState {
  const [status, setStatus] = useState<AdminAuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<{ name?: string; role?: string; roleLabel?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const auth = adminAuth();
    return onAuthStateChanged(auth, async (currentUser) => {
      setError(null);
      if (!currentUser) {
        setUser(null);
        setClaims(null);
        setStatus('signed-out');
        return;
      }

      setUser(currentUser);
      try {
        const { claims: c } = await getIdTokenResult(currentUser, true);
        if (c.admin === true) {
          setClaims({ name: c.name as string, role: c.role as string, roleLabel: c.roleLabel as string });
          setStatus('admin');
        } else {
          setClaims(null);
          setStatus('not-admin');
        }
      } catch {
        setStatus('signed-out');
        setError('관리자 권한을 확인하지 못했어요. 다시 로그인해주세요.');
      }
    });
  }, []);

  const login = useCallback(async (payload: { name: string; employeeId: string; phone: string }) => {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          employeeId: payload.employeeId,
          phone: payload.phone.replace(/[^0-9]/g, ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUser(null);
        setClaims(null);
        setStatus('signed-out');
        setError(data.error ?? '로그인에 실패했어요.');
        return;
      }
      const credential = await signInWithCustomToken(adminAuth(), data.customToken);
      const isAdmin = await hasAdminClaim(credential.user);
      if (!isAdmin) {
        await signOut(adminAuth());
        setUser(null);
        setClaims(null);
        setStatus('not-admin');
        setError('운영자/관리자 권한이 없는 계정입니다.');
        return;
      }
      const { claims: c } = await getIdTokenResult(credential.user, false);
      setUser(credential.user);
      setClaims({ name: c.name as string, role: c.role as string, roleLabel: c.roleLabel as string });
      setStatus('admin');
    } catch {
      setUser(null);
      setClaims(null);
      setStatus('signed-out');
      setError('로그인에 실패했어요. 이름, 사번, 전화번호를 확인해주세요.');
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(adminAuth());
    setUser(null);
    setClaims(null);
    setStatus('signed-out');
    setError(null);
  }, []);

  return { status, user, claims, error, login, logout };
}
