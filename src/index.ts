
import "dotenv/config";

import http from "http";
import { Server } from "socket.io";

import app from "./app";
import { connectMongoDB } from "./infrastructure/persistence/mongoose/connection";
import { registerRoutes } from "./infrastructure/http/routes";
import { SocketIoAuctionEventPublisher } from "./infrastructure/realtime/auction-event.publisher";
import { configureSocketServer } from "./infrastructure/realtime/socket-server";

const PORT = Number(process.env.PORT) || 3000;

const bootstrap = async (): Promise<void> => {
  await connectMongoDB();

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  configureSocketServer(io);

  const auctionEventPublisher = new SocketIoAuctionEventPublisher(io);

  registerRoutes(app, auctionEventPublisher);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on port ${PORT}`);
  });
};

bootstrap();
