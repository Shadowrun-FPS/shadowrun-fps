"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocketIO() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Only connect in the browser
    if (typeof window !== "undefined") {
      try {
        const socketInstance = io({
          path: "/api/socketio",
        });
        setSocket(socketInstance);

        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error("Failed to connect to Socket.IO:", error);
      }
    }
  }, []);

  return socket;
}
