import { logger } from '@/lib/logger';

export type OidcValidationResult = {
  isValid: boolean;
  error?: string;
};

function hasPathQueryOrHash(urlObj: URL): boolean {
  const hasNonRootPath = urlObj.pathname && urlObj.pathname !== '/';
  const hasQuery = !!urlObj.search;
  const hasHash = !!urlObj.hash;
  return hasNonRootPath || hasQuery || hasHash;
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Disallow obvious local names
  if (['localhost', '0.0.0.0', '127.0.0.1', '::1'].includes(lower)) {
    return true;
  }

  if (lower.endsWith('.local') || lower.endsWith('.internal')) {
    return true;
  }

  // Basic private IPv4 ranges
  if (/^10\./.test(lower)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower)) return true;
  if (/^192\.168\./.test(lower)) return true;

  return false;
}

export async function validateOidcConnection(issuer: string): Promise<OidcValidationResult> {
  try {
    // 1. Discovery Check: Fetch .well-known configuration
    // Ensure issuer doesn't end with slash to avoid double slash
    const normalizedIssuer = issuer.replace(/\/$/, '');

    // Security: OIDC issuer must use HTTPS to prevent MITM attacks
    if (!normalizedIssuer.startsWith('https://')) {
      return {
        isValid: false,
        error: 'OIDC issuer must use HTTPS for security. HTTP URLs are not allowed.',
      };
    }

    // SSRF Mitigation: Block internal/private addresses and malformed issuers
    let hostname = '';
    let urlObj: URL;
    try {
      urlObj = new URL(normalizedIssuer);
      hostname = urlObj.hostname.toLowerCase();
    } catch {
      return { isValid: false, error: 'Invalid Issuer URL format.' };
    }

    // OIDC issuer should be an origin, not a full path with query/fragment.
    if (hasPathQueryOrHash(urlObj)) {
      return {
        isValid: false,
        error: 'Issuer URL must not include a path, query string, or fragment.',
      };
    }

    const isInternal = isPrivateOrLocalHostname(hostname);

    if (isInternal) {
      logger.warn(`[OIDC Validation] SSRF attempt blocked for internal hostname: ${hostname}`);
      return {
        isValid: false,
        error: 'OIDC issuer cannot be an internal or private address.',
      };
    }

    // Reconstruct the URL from validated parts to break the taint chain.
    // This ensures that the fetch target is derived from the parsed,
    // validated hostname — NOT from the raw user-provided string.
    const safeOrigin = `${urlObj.protocol}//${urlObj.host}`;
    const discoveryUrl = `${safeOrigin}/.well-known/openid-configuration`;

    logger.info(`[OIDC Validation] Checking discovery URL: ${discoveryUrl}`);

    const response = await fetch(discoveryUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      logger.warn(`[OIDC Validation] Discovery failed with status: ${response.status}`);
      return {
        isValid: false,
        error: `Could not connect to Issuer URL (Status: ${response.status}). Please verify the URL.`,
      };
    }

    const config = await response.json();

    // 2. Metadata Check: Verify required endpoints exist
    if (!config.authorization_endpoint || !config.token_endpoint) {
      return {
        isValid: false,
        error:
          'Issuer metadata is missing required endpoints (authorization_endpoint, token_endpoint).',
      };
    }

    // 3. Algorithm Check: Verify RS256 support (NextAuth default)
    // Note: Some providers might not list it explicitly if they only support one, but it's good to check if array exists.
    if (Array.isArray(config.id_token_signing_alg_values_supported)) {
      if (!config.id_token_signing_alg_values_supported.includes('RS256')) {
        return {
          isValid: false,
          error: 'Identity Provider uses unsupported signing algorithms. RS256 is required.',
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    logger.error('[OIDC Validation] Connection error', { error });

    // Distinguish between network errors and others
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('fetch failed') || errorMessage.includes('timeout')) {
      return {
        isValid: false,
        error: 'Failed to connect to Issuer URL. Please check your network or the URL.',
      };
    }

    return {
      isValid: false,
      error: `Validation failed: ${errorMessage}`,
    };
  }
}
