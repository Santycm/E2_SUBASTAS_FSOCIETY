import { Bid } from "../entities/bid";

export interface CreateBidData {
  auctionId: string;
  bidderId: string;
  amount: number;
  status: Bid["status"];
  rejectionReason: Bid["rejectionReason"];
  createdAt: Date;
}

export interface BidRepository {
  save(data: CreateBidData): Promise<Bid>;

  findByAuctionId(auctionId: string): Promise<Bid[]>;

  findByBidderId(bidderId: string): Promise<Bid[]>;

  findHighestAcceptedByAuctionId(
    auctionId: string,
  ): Promise<Bid | null>;
}