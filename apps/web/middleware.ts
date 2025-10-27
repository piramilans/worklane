import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and auth routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth/")
  ) {
    return NextResponse.next();
  }

  try {
    // Extract subdomain from hostname
    const hostname = request.headers.get("host") || "";
    const host = hostname.split(":")[0] || "";
    const parts = host.split(".");

    let subdomain = null;

    // For localhost development, use default subdomain
    if (host === "localhost" || host === "127.0.0.1") {
      subdomain = "aaws"; // Default organization for localhost
    } else if (parts.length >= 3) {
      subdomain = parts[0]; // First part is subdomain
    }

    // Add organization context to headers for server components
    const response = NextResponse.next();

    if (subdomain) {
      response.headers.set("x-organization-subdomain", subdomain);
      // For now, we'll let the server components handle organization resolution
      // This avoids Prisma edge runtime issues
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
