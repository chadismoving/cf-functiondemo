// src/app/waiting-room-json/route.ts

import { NextResponse } from "next/server";

// Handle GET requests to this route
export async function GET() {
  return NextResponse.json({
    message: "Welcome to the waiting room. Please wait while we process your access.",
    actions: {
      logout: "/api/revoke-session",
    },
  });
}
