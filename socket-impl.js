// This file is completely separate from Next.js bundling
const { Server } = require("socket.io");

function initSocketIO(server) {
  console.log("Initializing Socket.IO server from separate implementation...");

  const io = new Server(server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Store io instance globally
  global.io = io;

  // Handle connections
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = { initSocketIO };
