import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Simply block Socket.IO paths in Edge Runtime
  return NextResponse.json(
    { error: "Socket.IO is only available through the custom server" },
    { status: 501 }
  );
}

export const config = {
  matcher: ["/api/socketio/:path*"],
};
