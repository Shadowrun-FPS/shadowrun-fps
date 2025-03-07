import { NextRequest, NextResponse } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

// This is a workaround for Next.js App Router
// In a real implementation, you'd use a more integrated approach
let io: SocketIOServer | null = null;

export async function GET(req: NextRequest) {
  if (!io) {
    const httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    httpServer.listen(3001, () => {
      console.log("Socket.IO server running on port 3001");
    });

    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  return NextResponse.json({ socketServer: "running on port 3001" });
}
