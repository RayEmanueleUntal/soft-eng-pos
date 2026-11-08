import { apiClient } from "@/lib/api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (token) {
    try {
      // Pass Authorization header explicitly for server-side execution
      await apiClient.post(
        "/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.error(
        "Backend logout error (proceeding to clear cookie):",
        error,
      );
    }
  }

  const response = NextResponse.json({ success: true });

  // Clear HTTP-only session cookie
  response.cookies.set({
    name: "access_token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
