import { Server as ServerIO } from "socket.io";
import { NextRequest } from "next/server";
import { createServer } from "http";

let io: ServerIO | null = null;

export async function GET(req: NextRequest) {
  if (!io) {
    // Create server without immediately listening
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

    // Add error handler
    httpServer.on("error", (e: any) => {
      if (e.code === "EADDRINUSE") {
        console.log("Socket.IO server already running");
        io = null;
      }
    });

    // Try to start server only once
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Socket.IO server start timeout"));
        }, 1000);

        httpServer.once("listening", () => {
          clearTimeout(timeout);

          resolve();
        });

        httpServer.listen(0); // Let OS assign available port
      });

      // Make io instance globally available
      (global as any).io = io;
    } catch (error) {
      console.error("Failed to start Socket.IO server:", error);
      io = null;
    }
  }

  return new Response(null, {
    status: io ? 200 : 500,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
