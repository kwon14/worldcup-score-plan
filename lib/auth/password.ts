import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, stored] = hash.split(':');
  if (!salt || !stored) return false;
  try {
    const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
    const storedBuf = Buffer.from(stored, 'hex');
    return storedBuf.length === derived.length && timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}
