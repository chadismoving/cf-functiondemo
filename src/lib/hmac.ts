// Default to 60 seconds to mirror Cloudflare example if no override is provided.
export const DEFAULT_TTL_SECONDS = Number(process.env.HMAC_TOKEN_TTL ?? '60');

const encoder = new TextEncoder();
const keyCache = new Map<string, Promise<CryptoKey>>();

function normalizeInputPath(path: string) {
  const trimmed = path.trim();
  if (!trimmed) {
    throw new Error('A non-empty path is required.');
  }

  const base = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://example.com${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;

  const url = new URL(base);

  if (url.origin !== 'https://example.com') {
    throw new Error('Only relative paths are supported in this demo.');
  }

  return url;
}

function resolveSecret(secretOverride?: string) {
  const secret = secretOverride ?? process.env.HMAC_SECRET;

  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('Missing HMAC_SECRET environment variable.');
  }

  return secret;
}

async function getKey(secret: string) {
  let cached = keyCache.get(secret);

  if (!cached) {
    cached = crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    keyCache.set(secret, cached);
  }

  return cached;
}

function toBase64(buffer: ArrayBuffer) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function fromBase64(value: string) {
  try {
    if (typeof Buffer !== 'undefined') {
      return Uint8Array.from(Buffer.from(value, 'base64'));
    }

    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  } catch (error) {
    throw new Error('Token is not valid base64.');
  }
}

export async function generateSignedPath(path: string, ttlSeconds = DEFAULT_TTL_SECONDS, secretOverride?: string) {
  const url = normalizeInputPath(path);
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = resolveSecret(secretOverride);
  const key = await getKey(secret);
  const macBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`${url.pathname}${timestamp}`));
  const base64Mac = toBase64(macBuffer);

  const params = url.searchParams;
  params.set('verify', `${timestamp}-${base64Mac}`);

  return {
    signedPath: `${url.pathname}${params.toString() ? `?${params.toString()}` : ''}`,
    verifyParam: params.get('verify')!,
    timestamp,
    ttlSeconds,
  };
}

export async function verifySignedPath(pathWithQuery: string, ttlSeconds = DEFAULT_TTL_SECONDS, secretOverride?: string) {
  const url = normalizeInputPath(pathWithQuery);
  const verifyParam = url.searchParams.get('verify');

  if (!verifyParam) {
    return { valid: false, reason: 'Missing verify query parameter.' } as const;
  }

  const [timestampText, macPart] = verifyParam.split('-');

  if (!timestampText || !macPart) {
    return { valid: false, reason: 'Malformed verify query parameter.' } as const;
  }

  const assertedTimestamp = Number(timestampText);

  if (!Number.isFinite(assertedTimestamp)) {
    return { valid: false, reason: 'Invalid timestamp in token.' } as const;
  }

  let providedMacBuffer: Uint8Array;
  try {
    providedMacBuffer = fromBase64(macPart);
  } catch (error) {
    return { valid: false, reason: 'Token is not valid base64.' } as const;
  }

  const secret = resolveSecret(secretOverride);
  const key = await getKey(secret);
  const matches = await crypto.subtle.verify(
    'HMAC',
    key,
    providedMacBuffer,
    encoder.encode(`${url.pathname}${assertedTimestamp}`),
  );

  if (!matches) {
    return { valid: false, reason: 'Signature mismatch.' } as const;
  }

  const now = Math.floor(Date.now() / 1000);

  if (now > assertedTimestamp + ttlSeconds) {
    return { valid: false, reason: 'Token has expired.' } as const;
  }

  // Drop verify param for context when returning.
  url.searchParams.delete('verify');

  return {
    valid: true,
    issuedAt: assertedTimestamp,
    expiresAt: assertedTimestamp + ttlSeconds,
    path: `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''}`,
  } as const;
}
