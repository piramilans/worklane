import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = cookies();

    // Clear all auth-related cookies
    const response = NextResponse.json({ success: true });

    // Clear NextAuth session cookies
    response.cookies.set("next-auth.session-token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    response.cookies.set("__Secure-next-auth.session-token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error clearing session:", error);
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    );
  }
}
