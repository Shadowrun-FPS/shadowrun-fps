import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

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
