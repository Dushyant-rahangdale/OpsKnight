import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '@/lib/version';
import packageJson from '../../package.json';

describe('Application Version Resolution', () => {
  it('correctly resolves to the package.json version', () => {
    expect(APP_VERSION).toBe(packageJson.version);
  });

  it('matches semantic versioning format', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
