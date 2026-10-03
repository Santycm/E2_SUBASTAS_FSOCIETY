export type BidStatus = 'ACCEPTED' | 'REJECTED';

export type BidRejectionReason =
  | 'AUCTION_NOT_OPEN'
  | 'AUCTION_CLOSED'
  | 'SELLER_CANNOT_BID'
  | 'AMOUNT_BELOW_MINIMUM'
  | 'AUCTION_CANCELLED';

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  status: BidStatus;
  rejectionReason: BidRejectionReason | null;
  createdAt: Date;
}