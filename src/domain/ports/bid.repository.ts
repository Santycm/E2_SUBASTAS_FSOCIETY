import { Bid } from '../entities/bid';

export interface BidRepository {
  findByAuctionId(auctionId: string): Promise<Bid[]>;

  findByBidderId(bidderId: string): Promise<Bid[]>;

  save(bid: Bid): Promise<Bid>;
}