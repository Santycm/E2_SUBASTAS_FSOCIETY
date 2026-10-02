import { Auction } from '../entities/auction';

export interface AuctionRepository {
  findAll(filters?: {
    categoryId?: string;
    status?: string;
  }): Promise<Auction[]>;

  findById(id: string): Promise<Auction | null>;

  findBySellerId(sellerId: string): Promise<Auction[]>;

  save(auction: Auction): Promise<Auction>;

  update(auction: Auction): Promise<Auction>;
}