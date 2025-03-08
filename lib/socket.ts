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

export function getIO() {
  return (global as any).io as SocketIOServer | null;
}

export function initSocket(httpServer: NetServer) {
  if (!(global as any).io) {
    const io = new SocketIOServer(httpServer, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
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
    });

    (global as any).io = io;
  }
  return (global as any).io;
}

export function emitMatchUpdate(matchData: any) {
  const socketIO = getIO();
  if (socketIO) {
    // Broadcast to all clients in the match room
    socketIO.to(`match:${matchData.matchId}`).emit("match:update", {
      ...matchData,
      timestamp: Date.now(),
      forceRefresh: matchData.mapScores?.some(
        (score: any) => score?.scoresMismatch
      ),
    });

    // Also emit to the general match updates channel
    socketIO.emit("matches:update", matchData);

    console.log(`Emitted match update to room match:${matchData.matchId}`);
  }
}
