import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Respond with the necessary header to revoke the user session
  const response = new NextResponse('Session revoked', {
    status: 200,
  });
  response.headers.set('Cf-Waiting-Room-Command', 'revoke'); // Add the required Cloudflare header
  return response;
}
