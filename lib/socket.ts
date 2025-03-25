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

export function emitMatchUpdate(matchId: string, data: any) {
  try {
    let socketIO;
    try {
      socketIO = getSocketIO();
    } catch (error) {
      console.warn("Socket.io not initialized, cannot emit match update");
      return false;
    }

    console.log(`Emitting match update for match ${matchId}`);
    socketIO.to(`match:${matchId}`).emit("match:update", data);
    return true;
  } catch (error) {
    console.error("Error emitting match update:", error);
    return false;
  }
}

function getSocketIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
