import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { Auction } from '../../../../domain/entities/auction';
import { auctionsData } from '../data/auctions.data';

export class MockAuctionRepository implements AuctionRepository {
  async findAll(filters?: {
    categoryId?: string;
    status?: string;
  }): Promise<Auction[]> {
    let result = [...auctionsData];

    if (filters?.categoryId) {
      result = result.filter(
        auction => auction.categoryId === filters.categoryId,
      );
    }

    if (filters?.status) {
      result = result.filter(
        auction => auction.status === filters.status,
      );
    }

    return result;
  }

  async findById(id: string): Promise<Auction | null> {
    return auctionsData.find(auction => auction.id === id) ?? null;
  }

  async findBySellerId(sellerId: string): Promise<Auction[]> {
    return auctionsData.filter(
      auction => auction.sellerId === sellerId,
    );
  }

  async save(auction: Auction): Promise<Auction> {
    auctionsData.push(auction);

    return auction;
  }

  async update(auction: Auction): Promise<Auction> {
    const index = auctionsData.findIndex(
      item => item.id === auction.id,
    );

    if (index === -1) {
      throw new Error('Auction not found');
    }

    auctionsData[index] = auction;

    return auction;
  }
}