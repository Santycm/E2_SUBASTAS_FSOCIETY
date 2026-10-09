import "dotenv/config";

import http from "http";
import { Server } from "socket.io";

import app from "./app";
import { connectMongoDB } from "./infrastructure/persistence/mongoose/connection";
import { registerRoutes } from "./infrastructure/http/routes";
import { SocketIoAuctionEventPublisher } from "./infrastructure/realtime/auction-event.publisher";

const PORT = Number(process.env.PORT) || 3000;

const bootstrap = async (): Promise<void> => {
  await connectMongoDB();

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] connected: ${socket.id}`);

    socket.on("JOIN_AUCTION", (auctionId: string) => {
      const room = `auction:${auctionId}`;

      socket.join(room);

      socket.emit("JOINED_AUCTION", {
        auctionId,
        room,
      });
    });

    socket.on("LEAVE_AUCTION", (auctionId: string) => {
      socket.leave(`auction:${auctionId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket.IO] disconnected: ${socket.id} (${reason})`,
      );
    });
  });

  const auctionEventPublisher = new SocketIoAuctionEventPublisher(io);

  registerRoutes(app, auctionEventPublisher);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on port ${PORT}`);
  });
};

bootstrap();
