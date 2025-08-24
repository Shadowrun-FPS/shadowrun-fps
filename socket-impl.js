// This file is completely separate from Next.js bundling
const { Server } = require("socket.io");

function initSocketIO(server) {
  console.log("Initializing Socket.IO server from separate implementation...");

  // Secure CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "https://shadowrunfps.com",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ];

  const io = new Server(server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
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
