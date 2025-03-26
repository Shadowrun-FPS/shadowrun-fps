import { NextRequest, NextResponse } from "next/server";

// This is a placeholder for WebSocket functionality
// In App Router, we need to use a different approach for WebSockets
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message:
      "WebSocket functionality is not available in this route. Use client-side polling instead.",
  });
}
