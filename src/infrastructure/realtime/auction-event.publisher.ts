import { Server } from "socket.io";

import {
  AuctionEventPublisher,
  AuctionClosedEvent,
  BidOutbidEvent,
  BidPlacedEvent,
} from "../../domain/ports/auction-event.publisher";

export class SocketIoAuctionEventPublisher implements AuctionEventPublisher {
  constructor(private readonly io: Server) {}

  publishBidPlaced(event: BidPlacedEvent): void {
    this.io.to(`auction:${event.auctionId}`).emit("BID_PLACED", event);
  }

  publishBidOutbid(event: BidOutbidEvent): void {
    this.io.to(`auction:${event.auctionId}`).emit("BID_OUTBID", event);
  }

  publishAuctionClosed(event: AuctionClosedEvent): void {
    this.io.to(`auction:${event.auctionId}`).emit("AUCTION_CLOSED", event);
  }
}
