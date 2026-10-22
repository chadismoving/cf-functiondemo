export const runtime = 'edge'; // Configure Edge Runtime

interface RequestBody {
  name: string;
  turnstileToken: string;
}

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

type RouteContext = {
  env: CloudflareEnv;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const body: RequestBody = await request.json();
    const { name, turnstileToken } = body;

    if (!name || !turnstileToken) {
      return new Response(
        JSON.stringify({ error: 'Name and Turnstile token are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify Turnstile token
    const turnstileSecret = context.env?.TURNSTILE_SECRET_KEY ?? process.env.TURNSTILE_SECRET_KEY;

    if (!turnstileSecret) {
      return new Response(
        JSON.stringify({ error: 'TURNSTILE_SECRET_KEY is not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: turnstileToken,
      }),
    });

    const turnstileResult: TurnstileResponse = await turnstileResponse.json();

    if (!turnstileResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid Turnstile token', details: turnstileResult['error-codes'] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert data into the D1 database
    const db = context.env?.D1DATABASE;

    if (!db) {
      return new Response(
        JSON.stringify({ error: 'D1 database binding unavailable.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const query = 'INSERT INTO names (name) VALUES (?);';
    const statement = db.prepare(query).bind(name);
    const result = await statement.run();

    // Check for errors
    if (!result.success) {
      throw new Error('Failed to insert name into the database');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    // Safely handle `err` of type `unknown`
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('Error handling request:', message);

    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
