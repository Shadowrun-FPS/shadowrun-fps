import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Server as NetServer } from "http";
import { NextApiRequest } from "next";

export function initSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Join tournament room
    socket.on("join-tournament", (tournamentId: string) => {
      socket.join(`tournament-${tournamentId}`);
    });

    // Join queue room
    socket.on("join-queue", (queueId: string) => {
      socket.join(`queue:${queueId}`);
    });

    // Leave rooms on disconnect
    socket.on("disconnect", () => {
      socket.rooms.forEach((room) => socket.leave(room));
    });

    socket.on("leave-tournament", (tournamentId: string) => {
      socket.leave(`tournament-${tournamentId}`);
    });

    socket.on("tournament-update", ({ tournamentId, tournament }) => {
      io.to(`tournament-${tournamentId}`).emit("tournament-update", tournament);
    });
  });

  return io;
}

export type { SocketIOServer };

export type NextApiResponseWithSocket = {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initSocketServer = (
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  return res.socket.server.io;
};
