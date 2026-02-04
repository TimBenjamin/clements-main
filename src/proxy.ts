import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./lib/db";

const SESSION_COOKIE_NAME = "session";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/subscribe",
];

// Routes that require specific user types
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin": ["admin"],
  "/students": ["org", "admin"],
  "/assignments/create": ["org", "admin"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and Next.js internal routes
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Get session from cookie
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    // Not logged in - redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validate session
  try {
    const session = await prisma.userSession.findFirst({
      where: { sessionId },
      include: { user: true },
    });

    if (!session) {
      // Invalid session - redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    const user = session.user;

    // Check subscription for ind/stu users (except for specific allowed routes)
    const SUBSCRIPTION_EXEMPT_ROUTES = ["/account", "/subscribe", "/renew"];

    if (
      (user.type === "ind" || user.type === "stu") &&
      !SUBSCRIPTION_EXEMPT_ROUTES.some((route) => pathname.startsWith(route))
    ) {
      if (!user.expiry || user.expiry < new Date()) {
        return NextResponse.redirect(new URL("/subscribe", request.url));
      }
    }

    // Check route permissions
    for (const [route, allowedTypes] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname.startsWith(route)) {
        if (!allowedTypes.includes(user.type)) {
          // User doesn't have permission - redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    }

    // Add user info to request headers (accessible in route handlers)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.id.toString());
    requestHeaders.set("x-user-type", user.type);
    requestHeaders.set("x-user-displayname", user.displayname);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
