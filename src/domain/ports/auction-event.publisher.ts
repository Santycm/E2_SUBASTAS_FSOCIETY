export interface BidPlacedEvent {
  auctionId: string;
  bidderId: string;
  amount: number;
  currentBid: number;
}

export interface BidOutbidEvent {
  auctionId: string;
  outbidBidderId: string;
  currentBid: number;
}

export interface AuctionClosedEvent {
  auctionId: string;
  status: 'CLOSED' | 'NO_BIDS';
  winnerId?: string;
}

export interface AuctionEventPublisher {
  publishBidPlaced(event: BidPlacedEvent): void;
  publishBidOutbid(event: BidOutbidEvent): void;
  publishAuctionClosed(event: AuctionClosedEvent): void;
}