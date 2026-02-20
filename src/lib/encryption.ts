/**
 * Encryption utilities for sensitive data
 * Uses AES-256-CBC encryption
 */

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { logger } from './logger';

/**
 * Encrypt text using AES-256-CBC
 */
let cachedKey: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function getFingerprint(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function validateEncryptionFingerprint(): Promise<boolean> {
  const currentKey = await getEncryptionKey();
  if (!currentKey) return false;

  const fingerprint = getFingerprint(currentKey);

  // Fetch stored fingerprint from SystemConfig (JSON store) to avoid schema changes
  const storedConfig = await prisma.systemConfig.findUnique({
    where: { key: 'encryption_fingerprint' },
  });

  if (!storedConfig) {
    // First run or migration: trust the current key and save its fingerprint
    await prisma.systemConfig.upsert({
      where: { key: 'encryption_fingerprint' },
      create: { key: 'encryption_fingerprint', value: { fingerprint } },
      update: { value: { fingerprint } },
    });
    return true;
  }

  const storedFingerprint = (storedConfig.value as any).fingerprint;

  if (storedFingerprint !== fingerprint) {
    logger.error('[Encryption] Key Mismatch! Current key does not match stored fingerprint.');
    return false;
  }

  return true;
}

function isValidHexKey(value: string) {
  return /^[0-9a-f]{64}$/i.test(value);
}

export const CANARY_Plaintext = 'OPS_KNIGHT_CRYPTO_CHECK';

export async function validateCanary(keyHex: string): Promise<boolean> {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: 'encryption_canary' } });

    // Bootstrap: If no canary exists, create one with the current key
    if (!config) {
      const encrypted = await encryptWithKey(CANARY_Plaintext, keyHex);
      await prisma.systemConfig.create({
        data: { key: 'encryption_canary', value: { encrypted } },
      });
      return true;
    }

    // Validate: Try to decrypt
    const encrypted = (config.value as any).encrypted;
    if (!encrypted) return false; // Should not happen

    const decrypted = await decryptWithKey(encrypted, keyHex);
    return decrypted === CANARY_Plaintext;
  } catch (error) {
    logger.error('[Encryption] Canary validation failed', { error });
    return false;
  }
}

export async function getEncryptionKey(): Promise<string | null> {
  const now = Date.now();
  if (cachedKey && now - cachedAt < CACHE_TTL_MS) {
    return cachedKey;
  }

  let activeKey: string | null = null;

  // 1. Try DB first (Source of Truth)
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
      select: { encryptionKey: true },
    });
    if (settings?.encryptionKey && isValidHexKey(settings.encryptionKey)) {
      activeKey = settings.encryptionKey;
    }
  } catch (e) {
    logger.error('Failed to fetch DB key', { error: e });
  }

  // 2. Fallback to Env
  if (!activeKey && process.env.ENCRYPTION_KEY) {
    activeKey = process.env.ENCRYPTION_KEY;
  }

  if (!activeKey) return null;

  // 3. Canary Check (The Safety Gate)
  // We only cache if the canary passes.
  const isSafe = await validateCanary(activeKey);
  if (!isSafe) {
    logger.error('CRITICAL: Encryption Key failed canary check. Entering Safe Mode.');
    return null; // Return null to disable encryption features rather than returning a bad key
  }

  cachedKey = activeKey;
  cachedAt = now;
  return activeKey;
}

export async function encryptWithKey(text: string, keyHex: string): Promise<string> {
  const algorithm = 'aes-256-cbc';
  if (!keyHex || !isValidHexKey(keyHex)) {
    throw new Error('Invalid encryption key provided');
  }

  // V2 Envelope Encryption
  // 1. Generate Data Encryption Key (DEK)
  const dek = crypto.randomBytes(32);
  const dekHex = dek.toString('hex');

  // 2. Encrypt Payload with DEK
  const payloadIv = crypto.randomBytes(16);
  const payloadCipher = crypto.createCipheriv(algorithm, dek, payloadIv);
  let encryptedPayload = payloadCipher.update(text, 'utf8', 'hex');
  encryptedPayload += payloadCipher.final('hex');

  // 3. Encrypt DEK with Master Key
  const masterKey = Buffer.from(keyHex, 'hex');
  const dekIv = crypto.randomBytes(16);
  const dekCipher = crypto.createCipheriv(algorithm, masterKey, dekIv);
  let encryptedDek = dekCipher.update(dekHex, 'utf8', 'hex');
  encryptedDek += dekCipher.final('hex');

  // Return formatted V2 Envelope string: v2:dekIv:encryptedDek:payloadIv:encryptedPayload
  return `v2:${dekIv.toString('hex')}:${encryptedDek}:${payloadIv.toString('hex')}:${encryptedPayload}`;
}

export async function encrypt(text: string): Promise<string> {
  const keyHex = await getEncryptionKey();
  if (!keyHex) throw new Error('ENCRYPTION_KEY not configured');
  return encryptWithKey(text, keyHex);
}

export async function decryptWithKey(encryptedText: string, keyHex: string): Promise<string> {
  const algorithm = 'aes-256-cbc';
  if (!keyHex || !isValidHexKey(keyHex)) {
    throw new Error('Invalid encryption key provided');
  }
  const masterKey = Buffer.from(keyHex, 'hex');

  // V2 Envelope Encryption support
  if (encryptedText.startsWith('v2:')) {
    const parts = encryptedText.split(':');
    if (parts.length !== 5) {
      throw new Error('Invalid v2 encrypted text format');
    }

    const dekIv = Buffer.from(parts[1], 'hex');
    const encryptedDek = parts[2];
    const payloadIv = Buffer.from(parts[3], 'hex');
    const encryptedPayload = parts[4];

    // 1. Decrypt DEK using Master Key
    const dekDecipher = crypto.createDecipheriv(algorithm, masterKey, dekIv);
    let dekHex = dekDecipher.update(encryptedDek, 'hex', 'utf8');
    dekHex += dekDecipher.final('utf8');
    const dek = Buffer.from(dekHex, 'hex');

    // 2. Decrypt Payload using DEK
    const payloadDecipher = crypto.createDecipheriv(algorithm, dek, payloadIv);
    let decrypted = payloadDecipher.update(encryptedPayload, 'hex', 'utf8');
    decrypted += payloadDecipher.final('utf8');

    return decrypted;
  }

  // Legacy format (v1 - no prefix)
  const parts = encryptedText.split(':');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, masterKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const keyHex = await getEncryptionKey();
    if (!keyHex) throw new Error('ENCRYPTION_KEY not configured');
    return await decryptWithKey(encryptedText, keyHex);
  } catch (error) {
    logger.error('[Encryption] Decryption error', { error });
    throw new Error('Failed to decrypt token');
  }
}
