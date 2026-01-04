import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';

type OidcConfigRecord = {
  enabled: boolean;
  issuer: string;
  clientId: string;
  clientSecret: string;
  autoProvision: boolean;
  allowedDomains: string[];
  roleMapping?: any;
  customScopes?: string | null;
  providerType?: string | null;
  providerLabel?: string | null;
  profileMapping?: Record<string, string> | null;
};

export type OidcConfig = {
  enabled: boolean;
  issuer: string;
  clientId: string;
  clientSecret: string;
  autoProvision: boolean;
  allowedDomains: string[];
  roleMapping?: any;
  customScopes?: string | null;
  providerType?: string | null;
  providerLabel?: string | null;
  profileMapping?: Record<string, string> | null;
};

export type OidcPublicConfig = {
  enabled: boolean;
  issuer: string | null;
  clientId: string | null;
  autoProvision: boolean;
  allowedDomains: string[];
  providerType?: string | null;
  providerLabel?: string | null;
};

function detectProviderType(issuer: string | null): string | null {
  if (!issuer) return null;
  const url = issuer.toLowerCase();

  if (
    url.includes('accounts.google.com') ||
    url.includes('googleapis.com') ||
    url.includes('google')
  ) {
    return 'google';
  }
  if (url.includes('okta')) return 'okta';
  if (
    url.includes('login.microsoftonline.com') ||
    url.includes('login.microsoft.com') ||
    url.includes('sts.windows.net') ||
    url.includes('microsoftonline')
  ) {
    return 'azure';
  }
  if (url.includes('auth0')) return 'auth0';
  return 'custom';
}

function normalizeDomains(domains: string[]) {
  return domains.map(domain => domain.trim().toLowerCase()).filter(Boolean);
}

async function getOidcConfigRecord(): Promise<OidcConfigRecord | null> {
  logger.debug('[OIDC] Fetching OIDC config from database', {
    component: 'oidc-config',
  });

  try {
    const config = await prisma.oidcConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      logger.info('[OIDC] No OIDC config found in database', {
        component: 'oidc-config',
      });
      return null;
    }

    logger.debug('[OIDC] Found OIDC config in database', {
      component: 'oidc-config',
      enabled: config.enabled,
      issuer: config.issuer,
      clientId: config.clientId,
      autoProvision: config.autoProvision,
      hasCustomScopes: !!config.customScopes,
      hasRoleMapping: !!config.roleMapping,
      hasProfileMapping: !!config.profileMapping,
      providerType: config.providerType,
      providerLabel: config.providerLabel,
      allowedDomainCount: config.allowedDomains?.length ?? 0,
    });

    return {
      enabled: config.enabled,
      issuer: config.issuer,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      autoProvision: config.autoProvision,
      allowedDomains: config.allowedDomains ?? [],
      roleMapping: config.roleMapping,
      customScopes: config.customScopes,
      profileMapping: config.profileMapping as Record<string, string> | null,
      providerType: config.providerType,
      providerLabel: config.providerLabel,
    };
  } catch (error) {
    // Database connection error or other Prisma errors
    // Return null to allow app to function without OIDC when DB is unavailable
    logger.error('[OIDC] Failed to fetch OIDC config from database', {
      component: 'oidc-config',
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

export async function getOidcConfig(): Promise<OidcConfig | null> {
  logger.debug('[OIDC] Loading OIDC config', {
    component: 'oidc-config',
  });

  const config = await getOidcConfigRecord();
  if (!config) {
    logger.info('[OIDC] OIDC config not available (no record in database)', {
      component: 'oidc-config',
    });
    return null;
  }

  if (!config.enabled) {
    logger.info('[OIDC] OIDC config is disabled', {
      component: 'oidc-config',
    });
    return null;
  }

  const missingFields: string[] = [];
  if (!config.issuer) missingFields.push('issuer');
  if (!config.clientId) missingFields.push('clientId');
  if (!config.clientSecret) missingFields.push('clientSecret');

  if (missingFields.length > 0) {
    logger.warn('[OIDC] OIDC config missing required fields', {
      component: 'oidc-config',
      missingFields,
    });
    return null;
  }

  try {
    logger.debug('[OIDC] Decrypting client secret', {
      component: 'oidc-config',
    });

    const clientSecret = await decrypt(config.clientSecret);

    const normalizedConfig = {
      enabled: config.enabled,
      issuer: config.issuer,
      clientId: config.clientId,
      clientSecret,
      autoProvision: config.autoProvision,
      allowedDomains: normalizeDomains(config.allowedDomains),
      roleMapping: config.roleMapping,
      customScopes: config.customScopes,
      profileMapping: config.profileMapping as Record<string, string> | null,
    };

    logger.info('[OIDC] Successfully loaded OIDC config', {
      component: 'oidc-config',
      issuer: normalizedConfig.issuer,
      clientId: normalizedConfig.clientId,
      autoProvision: normalizedConfig.autoProvision,
      allowedDomainCount: normalizedConfig.allowedDomains.length,
      hasRoleMapping: !!normalizedConfig.roleMapping,
      hasCustomScopes: !!normalizedConfig.customScopes,
      hasProfileMapping: !!normalizedConfig.profileMapping,
    });

    return normalizedConfig;
  } catch (error) {
    logger.error('[OIDC] Failed to decrypt client secret', {
      component: 'oidc-config',
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      hint: 'The ENCRYPTION_KEY environment variable may have changed or be invalid',
    });
    return null;
  }
}

export async function getOidcPublicConfig(): Promise<OidcPublicConfig | null> {
  const config = await getOidcConfigRecord();
  if (!config) {
    return null;
  }

  return {
    enabled: config.enabled,
    issuer: config.issuer || null,
    clientId: config.clientId || null,
    autoProvision: config.autoProvision,
    allowedDomains: normalizeDomains(config.allowedDomains),
    providerType: config.providerType ?? detectProviderType(config.issuer),
    providerLabel: config.providerLabel,
  };
}

export async function checkOidcIntegrity(): Promise<{ ok: boolean; error?: string }> {
  const config = await getOidcConfigRecord();
  if (!config || !config.enabled) {
    return { ok: true }; // Not enabled, so technically healthy
  }

  if (!config.clientSecret) {
    return { ok: false, error: 'Client Secret is missing' };
  }

  try {
    await decrypt(config.clientSecret);
    return { ok: true };
  } catch (error) {
    logger.error('[OIDC] Integrity check failed', { error });
    return {
      ok: false,
      error: 'Failed to decrypt Client Secret. The Encryption Key may have changed.',
    };
  }
}
