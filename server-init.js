// This file will only be used in Node.js environments
// Patch punycode before any other requires
require("./lib/patch-punycode");

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Import the socket implementation directly (not through Next.js)
let initSocketIO;
try {
  const socketImpl = require("./socket-impl");
  initSocketIO = socketImpl.initSocketIO;
} catch (error) {
  console.error("Failed to import socket implementation:", error);
  initSocketIO = () => null;
}

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Handle Socket.IO path separately
    if (req.url?.startsWith("/api/socketio")) {
      // Let Socket.IO handle it
      return;
    }

    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  if (typeof initSocketIO === "function") {
    initSocketIO(server);
  }

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
