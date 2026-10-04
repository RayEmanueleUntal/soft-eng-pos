// Current-user endpoint for the POS system's frontend session.
// Reads the httpOnly access_token cookie and returns the role from its JWT payload.
// Lets client components know the role without exposing the token itself.
import { NextRequest, NextResponse } from "next/server";

// Decodes the JWT payload without verifying it; the backend still enforces roles.
function decodeJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

// Returns { role } for the logged-in user, or { role: null } if not logged in.
export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const payload = token ? decodeJwtPayload(token) : null;

  return NextResponse.json({ role: payload?.role ?? null });
}
