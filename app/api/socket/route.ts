import { NextRequest, NextResponse } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { initSocket } from "@/lib/socket";
import type { NextApiRequest } from "next";

// This is a workaround for Next.js App Router
// In a real implementation, you'd use a more integrated approach
let io: SocketIOServer | null = null;

export async function GET(req: NextRequest) {
  // Initialize socket if not already initialized
  if (!(global as any).io) {
    const httpServer = (global as any).httpServer;
    if (httpServer) {
      initSocket(httpServer);
    }
  }

  return NextResponse.json({ ok: true });
}
