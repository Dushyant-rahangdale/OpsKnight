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
 * Legacy hash function (SHA256 concatenation)
 * Used for old keys before migration.
 * Low computational effort (fast), hence replaced by V2 for new keys.
 */
export function hashTokenV1(token: string) {
  const hash = createHash('sha256');
  hash.update(`${getDefaultSecret()}:${token}`);
  return hash.digest('hex');
}

/**
 * Secure hash function (Scrypt)
 * Used for all new keys and migrated keys.
 * High computational effort prevents brute-force.
 */
export function hashTokenV2(token: string) {
  // scryptSync(password, salt, keyLength, [options])
  const secret = getDefaultSecret();
  // Using the secret as salt is acceptable here as the secret is high-entropy
  const derivedKey = scryptSync(token, secret, 32);
  return derivedKey.toString('hex');
}

export const hashToken = hashTokenV2;
