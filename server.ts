// Patch punycode before any other imports
import "./lib/patch-punycode";

import { createServer } from "http";
import next from "next";
import { parseRequestUrl } from "./lib/parse-request-url.js";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parseRequestUrl(req.url || "");
    handle(req, res, parsedUrl);
  });

  // Only initialize Socket.IO in Node.js environment
  if (typeof window === "undefined" && !process.env.EDGE_RUNTIME) {
    // Dynamic import to prevent Edge Runtime issues
    import("./lib/socket-server.node")
      .then(({ initSocketServer }) => {
        initSocketServer(server);
      })
      .catch((err) => {
        console.error("Failed to initialize Socket.IO:", err);
      });
  }

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
