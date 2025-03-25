import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest } from "next";

export type NextApiResponseWithSocket = {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

let io: SocketIOServer | null = null;

export function getIO() {
  return io;
}

export function initSocket(httpServer: NetServer) {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: "*", // In production, set this to your actual domain
        methods: ["GET", "POST"],
        credentials: true,
      },
      connectTimeout: 10000,
      pingTimeout: 5000,
      pingInterval: 10000,
    });

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

      // Send immediate acknowledgment of connection
      socket.emit("connected", { id: socket.id });
    });
  }
  return io;
}

export function emitMatchUpdate(matchData: any) {
  if (!io) return;

  io.to(`match:${matchData.matchId}`).emit("match:update", {
    ...matchData,
    timestamp: Date.now(),
  });

  io.emit("matches:update", matchData);
}
