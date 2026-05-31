import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  getIdTokenResult,
  type Auth,
  type User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { app } from './config';

export interface EmployeeClaims {
  name: string;
  role: 'member' | 'operator' | 'admin';
  roleLabel: string;
  employeeId: string;
  admin: boolean;
}

export type ParticipantAuthStatus = 'loading' | 'signed-in' | 'signed-out';

let authInstance: Auth | null = null;

function participantAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is only available in the browser');
  }
  authInstance ??= getAuth(app);
  return authInstance;
}

function waitForInitialAuthState(auth: Auth): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function signInWithToken(customToken: string): Promise<User> {
  const { user } = await signInWithCustomToken(participantAuth(), customToken);
  return user;
}

export async function signOutParticipant(): Promise<void> {
  await signOut(participantAuth());
}

export async function getOrCreateParticipantUser(): Promise<User> {
  const auth = participantAuth();
  const user = auth.currentUser ?? (await waitForInitialAuthState(auth));
  if (!user) throw new Error('로그인이 필요합니다.');
  return user;
}

export async function getParticipantId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const auth = participantAuth();
  const user = auth.currentUser ?? (await waitForInitialAuthState(auth));
  return user?.uid ?? null;
}

export async function getEmployeeClaims(user: User): Promise<EmployeeClaims | null> {
  const { claims } = await getIdTokenResult(user, false);
  if (!claims.employeeId) return null;
  return {
    name: claims.name as string,
    role: claims.role as 'member' | 'operator' | 'admin',
    roleLabel: claims.roleLabel as string,
    employeeId: claims.employeeId as string,
    admin: claims.admin as boolean,
  };
}

export function useParticipantAuth() {
  const [status, setStatus] = useState<ParticipantAuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<EmployeeClaims | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = participantAuth();
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const c = await getEmployeeClaims(currentUser);
        setClaims(c);
        setStatus('signed-in');
      } else {
        setClaims(null);
        setStatus('signed-out');
      }
    });
  }, []);

  const logout = async () => {
    await signOutParticipant();
    setUser(null);
    setClaims(null);
    setStatus('signed-out');
  };

  return { status, user, claims, logout };
}
