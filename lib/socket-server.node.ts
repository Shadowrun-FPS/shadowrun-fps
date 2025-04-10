// Move the contents of socket-server.ts here
// This file will only be used in Node.js environments
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";

// Export your existing Socket.IO setup
export function initSocketServer(httpServer: NetServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Your existing Socket.IO setup code
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    // Other event handlers
  });

  return io;
}

// Export a dummy version for client-side imports
export const dummySocketIO = {
  // Add any methods that might be called from client code
  // with empty implementations
};
