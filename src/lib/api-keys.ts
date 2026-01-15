import { createHash, createHmac, randomBytes, scryptSync } from 'crypto';
import { getNextAuthSecretSync } from '@/lib/secret-manager';

function getDefaultSecret(): string {
  return process.env.API_KEY_SECRET || getNextAuthSecretSync();
}

export function generateApiKey() {
  const raw = randomBytes(32).toString('base64url');
  const token = `ok_${raw}`;
  return {
    token,
    prefix: token.slice(0, 8),
    tokenHash: hashTokenV2(token),
  };
}

/**
 * Legacy hash function (upgraded to use scrypt for stronger, slower hashing)
 * Kept only for backward-compatibility lookups and lazy migration.
 */
export function hashTokenV1(token: string) {
  const secret = getDefaultSecret();
  const derivedKey = scryptSync(token, secret, 32);
  return derivedKey.toString('hex');
}

/**
 * Secure hash function (HMAC-SHA256)
 * Recommended for authentication tokens
 */
export function hashTokenV2(token: string) {
  const hmac = createHmac('sha256', getDefaultSecret());
  hmac.update(token);
  return hmac.digest('hex');
}

export const hashToken = hashTokenV2;
