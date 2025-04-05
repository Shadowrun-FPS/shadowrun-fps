"use server";

import { Server as NetServer } from "http";
import { NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "nodejs",
};

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: any;
    };
  };
};

// This is a placeholder function that will be replaced in the custom server
export function initSocketServer(server: NetServer) {
  console.log("This function should only be called from the custom server");
  return null;
}

// Safe export for client-side
export const dummySocketIO = {
  // Add any methods that might be called from client code
};
