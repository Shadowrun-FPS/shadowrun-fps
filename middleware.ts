import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { initSocketServer } from "./lib/socket-server";

export function middleware(request: NextRequest) {
  // Initialize Socket.IO if not already initialized
  if (!(global as any).io && (global as any).server) {
    initSocketServer((global as any).server);
  }

  return NextResponse.next();
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
