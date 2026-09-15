import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { message: "Access token is required" },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: "access_token",
      value: access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
