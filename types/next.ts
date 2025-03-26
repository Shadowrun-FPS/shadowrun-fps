import { NextApiResponse } from "next";
import { Server as NetServer } from "http";
import { Socket as NetSocket } from "net";
import { Server as SocketIOServer } from "socket.io";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};
