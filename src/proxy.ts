import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// https://nextjs.org/docs/app/api-reference/file-conventions/proxy

// Example of default export
export function proxy(request: NextRequest) {
    void request;
    // Example: Add a custom header to all responses
    const response = NextResponse.next();
    response.headers.set("x-middleware-cache", "no-cache");

    return response;
}

// Configure which paths the proxy should run on
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
