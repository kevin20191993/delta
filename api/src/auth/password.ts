import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [scheme, salt, expectedHash] = storedHash.split(':');

  if (scheme !== 'scrypt' || !salt || !expectedHash) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = scryptSync(password, salt, KEY_LENGTH);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

