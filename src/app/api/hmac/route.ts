import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_TTL_SECONDS, generateSignedPath, verifySignedPath } from '@/lib/hmac';

export const runtime = 'edge';

const ERROR_RESPONSES = {
  INVALID_JSON: NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }),
  INVALID_MODE: NextResponse.json({ error: 'Provide a mode of "generate" or "verify".' }, { status: 400 }),
  INVALID_PATH: NextResponse.json({ error: 'Provide a non-empty path string.' }, { status: 400 }),
  INVALID_TTL: NextResponse.json({ error: 'ttlSeconds must be a positive number when provided.' }, { status: 400 }),
};

function resolveTtlSeconds(ttl: unknown) {
  if (ttl === undefined) {
    return DEFAULT_TTL_SECONDS;
  }

  if (typeof ttl !== 'number' || Number.isNaN(ttl) || ttl <= 0) {
    return null;
  }

  return Math.floor(ttl);
}

type RouteContext = {
  env: CloudflareEnv;
};

export async function POST(req: NextRequest, context: RouteContext) {
  let payload: { mode?: string; path?: string; ttlSeconds?: number };

  try {
    payload = await req.json();
  } catch {
    return ERROR_RESPONSES.INVALID_JSON;
  }

  const { mode, path, ttlSeconds } = payload;

  if (!mode || (mode !== 'generate' && mode !== 'verify')) {
    return ERROR_RESPONSES.INVALID_MODE;
  }

  if (!path || typeof path !== 'string') {
    return ERROR_RESPONSES.INVALID_PATH;
  }

  const ttl = resolveTtlSeconds(ttlSeconds);

  if (ttl === null) {
    return ERROR_RESPONSES.INVALID_TTL;
  }

  try {
    const secret = context.env?.HMAC_SECRET ?? process.env.HMAC_SECRET;

    if (!secret) {
      return NextResponse.json({ error: 'HMAC_SECRET binding is not configured.' }, { status: 500 });
    }

    if (mode === 'generate') {
      const result = await generateSignedPath(path, ttl, secret);

      return NextResponse.json({
        issuedAt: result.timestamp,
        expiresAt: result.timestamp + ttl,
        signedPath: result.signedPath,
        verifyParam: result.verifyParam,
        ttlSeconds: ttl,
      });
    }

    const result = await verifySignedPath(path, ttl, secret);

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        reason: result.reason,
        ttlSeconds: ttl,
      });
    }

    return NextResponse.json({
      valid: true,
      issuedAt: result.issuedAt,
      expiresAt: result.expiresAt,
      path: result.path,
      ttlSeconds: ttl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error.',
      },
      { status: 400 },
    );
  }
}
