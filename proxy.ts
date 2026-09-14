import { NextRequest, NextResponse } from "next/server";
import { ROLE_PERMISSIONS, Role } from "@/lib/auth/roles";

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

function getAllowedRoles(pathname: string): Role[] | null {
  // Exact match
  if (ROLE_PERMISSIONS[pathname]) {
    return ROLE_PERMISSIONS[pathname];
  }

  // Match nested routes
  const matchingRoute = Object.keys(ROLE_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname.startsWith(`${route}/`));

  return matchingRoute ? ROLE_PERMISSIONS[matchingRoute] : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;

  // Not logged in
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const payload = decodeJwtPayload(token);

  // Invalid JWT structure
  if (!payload) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const role = payload.role as Role | undefined;

  const allowedRoles = getAllowedRoles(pathname);

  // Route requires specific roles
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
