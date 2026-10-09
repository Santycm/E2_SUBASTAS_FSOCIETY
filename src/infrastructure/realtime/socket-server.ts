
import { Server } from "socket.io";

export const configureSocketServer = (io: Server): void => {
  io.on("connection", (socket) => {
    console.log(`[Socket.IO] connected: ${socket.id}`);

    socket.on("JOIN_AUCTION", (auctionId: unknown) => {
      if (typeof auctionId !== "string" || !auctionId.trim()) {
        socket.emit("SOCKET_ERROR", {
          message: "INVALID_AUCTION_ID",
        });
        return;
      }

      const room = `auction:${auctionId}`;

      socket.join(room);

      socket.emit("JOINED_AUCTION", {
        auctionId,
        room,
      });
    });

    socket.on("LEAVE_AUCTION", (auctionId: unknown) => {
      if (typeof auctionId !== "string" || !auctionId.trim()) {
        socket.emit("SOCKET_ERROR", {
          message: "INVALID_AUCTION_ID",
        });
        return;
      }

      socket.leave(`auction:${auctionId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] disconnected: ${socket.id} (${reason})`);
    });
  });
};
