/**
 * Encryption utilities for sensitive data
 * Uses AES-256-CBC encryption with envelope encryption (v2).
 *
 * Key resolution order:
 *  1. ENCRYPTION_KEY environment variable (required in production)
 *  2. Static development fallback key (only when NODE_ENV === 'development')
 */

import crypto from 'crypto';
import { logger } from './logger';

// Stable, well-known fallback key for local development only.
// This is intentionally public knowledge — it is NOT a secret.
const DEV_FALLBACK_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

function isValidHexKey(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value);
}

/**
 * Resolve the active encryption key.
 * Returns null only in production when ENCRYPTION_KEY is not set.
 */
export function getEncryptionKey(): string | null {
  const envKey = process.env.ENCRYPTION_KEY;

  if (envKey) {
    if (!isValidHexKey(envKey)) {
      logger.error(
        '[Encryption] ENCRYPTION_KEY is set but is not a valid 32-byte hex string (64 hex chars). Encryption disabled.'
      );
      return null;
    }
    return envKey;
  }

  if (process.env.NODE_ENV === 'development') {
    logger.warn(
      '[Encryption] ENCRYPTION_KEY not set. Using development fallback key. DO NOT use this in production.'
    );
    return DEV_FALLBACK_KEY;
  }

  logger.error(
    '[Encryption] ENCRYPTION_KEY environment variable is not set. Encryption features are disabled.'
  );
  return null;
}

/**
 * Encrypt text using AES-256-CBC envelope encryption (v2 format).
 */
export async function encryptWithKey(text: string, keyHex: string): Promise<string> {
  const algorithm = 'aes-256-cbc';
  if (!keyHex || !isValidHexKey(keyHex)) {
    throw new Error('Invalid encryption key provided');
  }

  // 1. Generate Data Encryption Key (DEK)
  const dek = crypto.randomBytes(32);
  const dekHex = dek.toString('hex');

  // 2. Encrypt payload with DEK
  const payloadIv = crypto.randomBytes(16);
  const payloadCipher = crypto.createCipheriv(algorithm, dek, payloadIv);
  let encryptedPayload = payloadCipher.update(text, 'utf8', 'hex');
  encryptedPayload += payloadCipher.final('hex');

  // 3. Encrypt DEK with master key
  const masterKey = Buffer.from(keyHex, 'hex');
  const dekIv = crypto.randomBytes(16);
  const dekCipher = crypto.createCipheriv(algorithm, masterKey, dekIv);
  let encryptedDek = dekCipher.update(dekHex, 'utf8', 'hex');
  encryptedDek += dekCipher.final('hex');

  // v2:dekIv:encryptedDek:payloadIv:encryptedPayload
  return `v2:${dekIv.toString('hex')}:${encryptedDek}:${payloadIv.toString('hex')}:${encryptedPayload}`;
}

/**
 * Decrypt ciphertext using AES-256-CBC. Supports both v1 (legacy) and v2 (envelope) formats.
 */
export async function decryptWithKey(encryptedText: string, keyHex: string): Promise<string> {
  const algorithm = 'aes-256-cbc';
  if (!keyHex || !isValidHexKey(keyHex)) {
    throw new Error('Invalid encryption key provided');
  }
  const masterKey = Buffer.from(keyHex, 'hex');

  // V2 envelope format
  if (encryptedText.startsWith('v2:')) {
    const parts = encryptedText.split(':');
    if (parts.length !== 5) {
      throw new Error('Invalid v2 encrypted text format');
    }
    const dekIv = Buffer.from(parts[1], 'hex');
    const encryptedDek = parts[2];
    const payloadIv = Buffer.from(parts[3], 'hex');
    const encryptedPayload = parts[4];

    const dekDecipher = crypto.createDecipheriv(algorithm, masterKey, dekIv);
    let dekHex = dekDecipher.update(encryptedDek, 'hex', 'utf8');
    dekHex += dekDecipher.final('utf8');
    const dek = Buffer.from(dekHex, 'hex');

    const payloadDecipher = crypto.createDecipheriv(algorithm, dek, payloadIv);
    let decrypted = payloadDecipher.update(encryptedPayload, 'hex', 'utf8');
    decrypted += payloadDecipher.final('utf8');
    return decrypted;
  }

  // Legacy v1 format: iv:ciphertext
  const parts = encryptedText.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, masterKey, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Encrypt using the active system key.
 */
export async function encrypt(text: string): Promise<string> {
  const keyHex = getEncryptionKey();
  if (!keyHex) throw new Error('ENCRYPTION_KEY not configured');
  return encryptWithKey(text, keyHex);
}

/**
 * Decrypt using the active system key.
 */
export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const keyHex = getEncryptionKey();
    if (!keyHex) throw new Error('ENCRYPTION_KEY not configured');
    return await decryptWithKey(encryptedText, keyHex);
  } catch (primaryError) {
    // If primary decryption fails, attempt legacy database-backed key fallback
    try {
      const prismaModule = await import('./prisma');
      const prisma = prismaModule.default;
      const settings = await prisma.systemSettings.findUnique({
        where: { id: 'default' },
        select: { encryptionKey: true },
      });

      if (settings?.encryptionKey) {
        logger.warn(
          '[Encryption] Primary decryption failed. Attempting legacy database key fallback...'
        );
        const decryptedLegacy = await decryptWithKey(encryptedText, settings.encryptionKey);
        logger.info(
          '[Encryption] Legacy decryption succeeded. Initiating background transparent migration to new key...'
        );

        // Asynchronously migrate this specific ciphertext to the new key in the database
        // without blocking the returned result:
        const keyHex = getEncryptionKey();
        if (keyHex) {
          Promise.resolve().then(async () => {
            try {
              const newEncrypted = await encryptWithKey(decryptedLegacy, keyHex);

              // 1. Check OidcConfig
              await prisma.oidcConfig.updateMany({
                where: { clientSecret: encryptedText },
                data: { clientSecret: newEncrypted },
              });

              // 2. Check SlackIntegration
              await prisma.slackIntegration.updateMany({
                where: { botToken: encryptedText },
                data: { botToken: newEncrypted },
              });
              await prisma.slackIntegration.updateMany({
                where: { signingSecret: encryptedText },
                data: { signingSecret: newEncrypted },
              });

              // 3. Check SlackOAuthConfig
              await prisma.slackOAuthConfig.updateMany({
                where: { clientSecret: encryptedText },
                data: { clientSecret: newEncrypted },
              });

              // For provider JSON configs, it's prefixed by "enc:". So we search for "enc:" + encryptedText.
              const oldEncPrefixed = 'enc:' + encryptedText;
              const newEncPrefixed = 'enc:' + newEncrypted;

              // 4. Check NotificationProvider config values
              const notifProviders = await prisma.notificationProvider.findMany();
              for (const np of notifProviders) {
                if (np.config && typeof np.config === 'object') {
                  let updated = false;
                  const cfg = { ...(np.config as Record<string, any>) };
                  for (const [k, v] of Object.entries(cfg)) {
                    if (v === oldEncPrefixed) {
                      cfg[k] = newEncPrefixed;
                      updated = true;
                    }
                  }
                  if (updated) {
                    await prisma.notificationProvider.update({
                      where: { id: np.id },
                      data: { config: cfg },
                    });
                    logger.info(
                      `[Encryption] Dynamic migration: updated NotificationProvider ${np.id} configuration.`
                    );
                  }
                }
              }
            } catch (migrationError) {
              logger.error('[Encryption] Dynamic on-the-fly migration error', { migrationError });
            }
          });
        }

        return decryptedLegacy;
      }
    } catch (fallbackError) {
      logger.error('[Encryption] Legacy fallback decryption failed or skipped', { fallbackError });
    }

    logger.error('[Encryption] Decryption error', { error: primaryError });
    throw new Error('Failed to decrypt token');
  }
}
