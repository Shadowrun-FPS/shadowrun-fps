import { Server as ServerIO } from "socket.io";
import { NextRequest } from "next/server";
import { createServer } from "http";

let io: ServerIO | null = null;

export async function GET(req: NextRequest) {
  if (!io) {
    const httpServer = createServer();

    io = new ServerIO(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
      path: "/api/socketio",
      addTrailingSlash: false,
      transports: ["websocket", "polling"],
    });

    // Listen on a different port
    httpServer.listen(3001);

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join-match", (matchId: string) => {
        socket.join(`match:${matchId}`);
        console.log(`Client ${socket.id} joined match room: ${matchId}`);
      });

      socket.on("subscribe-matches", () => {
        socket.join("matches");
        console.log(`Client ${socket.id} subscribed to matches updates`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    // Make io instance globally available
    (global as any).io = io;
  }

  return new Response("Socket.IO server running", {
    status: 200,
  });
}
