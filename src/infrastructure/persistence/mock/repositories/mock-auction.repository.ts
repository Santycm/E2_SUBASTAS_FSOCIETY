import { Auction } from '../../../../domain/entities/auction';
import {
  AuctionRepository,
  CreateAuctionData,
  FindAuctionsFilters,
  FindAuctionsResult,
} from '../../../../domain/ports/auction.repository';

export class MockAuctionRepository implements AuctionRepository {
  private auctions: Auction[] = [];

  async findAll(
    filters: FindAuctionsFilters,
  ): Promise<FindAuctionsResult> {
    const filteredAuctions = this.auctions.filter((auction) => {
      const matchesCategory =
        !filters.categoryId ||
        auction.categoryId === filters.categoryId;

      const matchesStatus =
        !filters.status ||
        auction.status === filters.status;

      return matchesCategory && matchesStatus;
    });

    const total = filteredAuctions.length;

    const skip = (filters.page - 1) * filters.limit;

    const data = filteredAuctions.slice(
      skip,
      skip + filters.limit,
    );

    return {
      data,
      total,
    };
  }

  async findById(id: string): Promise<Auction | null> {
    return this.auctions.find((auction) => auction.id === id) ?? null;
  }

  async findBySellerId(sellerId: string): Promise<Auction[]> {
    return this.auctions.filter(
      (auction) => auction.sellerId === sellerId,
    );
  }

  async save(data: CreateAuctionData): Promise<Auction> {
    const auction: Auction = {
      id: `mock-${String(this.auctions.length + 1).padStart(3, '0')}`,
      ...data,
    };

    this.auctions.push(auction);

    return auction;
  }

  async update(auction: Auction): Promise<Auction> {
    const index = this.auctions.findIndex(
      (currentAuction) => currentAuction.id === auction.id,
    );

    if (index === -1) {
      throw new Error('AUCTION_NOT_FOUND');
    }

    this.auctions[index] = auction;

    return auction;
  }
}