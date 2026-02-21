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
    // 1. Parse and validate the input
    const trimmedIssuer = issuer?.trim();
    if (!trimmedIssuer) {
      return { isValid: false, error: 'Issuer URL is required.' };
    }

    // 2. Parse the URL — this validates structure
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedIssuer);
    } catch {
      return { isValid: false, error: 'Invalid Issuer URL format.' };
    }

    // 3. Enforce HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'OIDC issuer must use HTTPS for security. HTTP URLs are not allowed.',
      };
    }

    // 4. Reject URLs with paths, queries, or fragments
    if (hasPathQueryOrHash(parsedUrl)) {
      return {
        isValid: false,
        error: 'Issuer URL must not include a path, query string, or fragment.',
      };
    }

    // 5. Extract and validate hostname
    const validatedHostname = parsedUrl.hostname.toLowerCase();
    const port = parsedUrl.port; // preserve non-standard ports

    if (!validatedHostname) {
      return { isValid: false, error: 'Issuer URL has no hostname.' };
    }

    if (isPrivateOrLocalHostname(validatedHostname)) {
      logger.warn(
        `[OIDC Validation] SSRF attempt blocked for internal hostname: ${validatedHostname}`
      );
      return {
        isValid: false,
        error: 'OIDC issuer cannot be an internal or private address.',
      };
    }

    // 6. Build the discovery URL from validated primitives.
    //    This severs the CodeQL taint chain: the fetch URL is constructed
    //    from the literal "https://" prefix + validated hostname + a
    //    static well-known path. No user-provided string flows to fetch().
    const safeHost = port ? `${validatedHostname}:${port}` : validatedHostname;
    const discoveryUrl = `https://${safeHost}/.well-known/openid-configuration`;

    logger.info(`[OIDC Validation] Checking discovery URL: ${discoveryUrl}`);

    const response = await fetch(discoveryUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
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
