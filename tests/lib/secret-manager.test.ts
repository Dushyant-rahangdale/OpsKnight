import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Logger mock so test output stays clean and so we can assert on warnings.
const loggerMock = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
vi.mock('@/lib/logger', () => ({ logger: loggerMock }));

// Module re-imported per test (we use isolateModules) so the in-memory
// cache inside secret-manager doesn't leak across cases.
async function freshSecretManager() {
  const mod = await vi.importActual<typeof import('@/lib/secret-manager')>('@/lib/secret-manager');
  return mod;
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  loggerMock.warn.mockClear();
  loggerMock.error.mockClear();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('getNextAuthSecret', () => {
  it('returns NEXTAUTH_SECRET when set (highest priority)', async () => {
    process.env.NEXTAUTH_SECRET = 'explicit-secret-value-1234567890abcdef';
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    const { getNextAuthSecret } = await freshSecretManager();
    const secret = await getNextAuthSecret();
    expect(secret).toBe('explicit-secret-value-1234567890abcdef');
  });

  it('derives a stable secret from ENCRYPTION_KEY when NEXTAUTH_SECRET is missing', async () => {
    delete process.env.NEXTAUTH_SECRET;
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    const { getNextAuthSecret } = await freshSecretManager();
    const secret1 = await getNextAuthSecret();
    const secret2 = await getNextAuthSecret();
    // Same value across calls — required so Node and Edge runtimes agree.
    expect(secret1).toBe(secret2);
    // Not equal to the ENCRYPTION_KEY itself (domain-separated digest).
    expect(secret1).not.toBe('a'.repeat(64));
    // Looks like a base64 SHA-256 digest (~44 chars).
    expect(secret1.length).toBeGreaterThanOrEqual(40);
  });

  it('derives the SAME value across fresh module loads with the same ENCRYPTION_KEY (Node/Edge parity)', async () => {
    delete process.env.NEXTAUTH_SECRET;
    process.env.ENCRYPTION_KEY = 'b'.repeat(64);
    const sm1 = await freshSecretManager();
    const v1 = await sm1.getNextAuthSecret();
    vi.resetModules();
    const sm2 = await freshSecretManager();
    const v2 = await sm2.getNextAuthSecret();
    expect(v1).toBe(v2);
  });

  it('derives a DIFFERENT value for different ENCRYPTION_KEYs', async () => {
    delete process.env.NEXTAUTH_SECRET;
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    const sm1 = await freshSecretManager();
    const v1 = await sm1.getNextAuthSecret();
    vi.resetModules();
    process.env.ENCRYPTION_KEY = 'c'.repeat(64);
    const sm2 = await freshSecretManager();
    const v2 = await sm2.getNextAuthSecret();
    expect(v1).not.toBe(v2);
  });

  it('rejects too-short ENCRYPTION_KEY (entropy floor)', async () => {
    delete process.env.NEXTAUTH_SECRET;
    process.env.ENCRYPTION_KEY = 'short'; // < 32 chars
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const { getNextAuthSecret } = await freshSecretManager();
    await expect(getNextAuthSecret()).rejects.toThrow(/NEXTAUTH_SECRET is not set/);
  });

  it('throws in production when neither NEXTAUTH_SECRET nor ENCRYPTION_KEY is set', async () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ENCRYPTION_KEY;
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const { getNextAuthSecret } = await freshSecretManager();
    await expect(getNextAuthSecret()).rejects.toThrow(/NEXTAUTH_SECRET is not set/);
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it('falls back to ephemeral in development with a loud warn', async () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ENCRYPTION_KEY;
    (process.env as Record<string, string>).NODE_ENV = 'development';
    const { getNextAuthSecret } = await freshSecretManager();
    const secret = await getNextAuthSecret();
    expect(secret.length).toBeGreaterThan(10);
    expect(loggerMock.warn).toHaveBeenCalled();
  });

  it('ephemeral dev secret is cached across calls', async () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ENCRYPTION_KEY;
    (process.env as Record<string, string>).NODE_ENV = 'development';
    const { getNextAuthSecret } = await freshSecretManager();
    const a = await getNextAuthSecret();
    const b = await getNextAuthSecret();
    expect(a).toBe(b);
  });
});
