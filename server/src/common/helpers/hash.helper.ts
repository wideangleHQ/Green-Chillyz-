import { createHash, randomBytes } from 'crypto';

export function generateToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

export function hashSha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
