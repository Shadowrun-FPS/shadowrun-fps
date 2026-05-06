import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, adminRateLimit, authRateLimit } from "./lib/rate-limiting";
import { generateCSPHeader } from "./lib/security-config";

const criticalAuthPaths = [
  "/api/auth/session",
  "/api/auth/csrf",
  "/api/auth/providers",
  "/api/auth/signin",
  "/api/auth/callback",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const shouldSkipRateLimit = criticalAuthPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (!shouldSkipRateLimit) {
    let rateLimitResult;

    if (pathname.startsWith("/api/admin/")) {
      rateLimitResult = adminRateLimit(request);
    } else if (
      pathname.startsWith("/api/auth/") ||
      pathname.startsWith("/api/discord/")
    ) {
      rateLimitResult = authRateLimit(request);
    } else if (pathname.startsWith("/api/")) {
      rateLimitResult = rateLimit(request);
    }

    if (rateLimitResult && !rateLimitResult.success) {
      return rateLimitResult.error!;
    }
  }

  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", generateCSPHeader());
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Server", "");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  response.headers.set(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "bluetooth=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "picture-in-picture=()",
    ].join(", ")
  );

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
