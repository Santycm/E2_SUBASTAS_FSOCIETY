export type AuctionStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'CANCELLED'
  | 'NO_BIDS';

export interface Auction {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  sellerId: string;
  basePrice: number;
  minimumIncrement: number;
  currentBid: number | null;
  status: AuctionStatus;
  closesAt: Date;
  createdAt: Date;
}