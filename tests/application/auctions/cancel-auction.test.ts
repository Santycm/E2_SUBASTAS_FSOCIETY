
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Auction } from '../../../src/domain/entities/auction';
import { AuctionRepository } from '../../../src/domain/ports/auction.repository';
import { CancelAuctionUseCase } from '../../../src/application/use-cases/auctions/cancel-auction/cancel-auction';

describe('CancelAuctionUseCase', () => {
  const auction: Auction = {
    id: 'auction-001',
    title: 'Laptop',
    description: 'Laptop usada',
    categoryId: 'category-001',
    sellerId: 'seller-001',
    basePrice: 100000,
    minimumIncrement: 10000,
    currentBid: null,
    status: 'OPEN',
    closesAt: new Date('2026-11-01T14:00:00.000Z'),
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
  };

  let auctionRepository: {
    findById: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };

  let useCase: CancelAuctionUseCase;

  beforeEach(() => {
    auctionRepository = {
      findById: vi.fn().mockResolvedValue(auction),
      updateStatus: vi.fn().mockResolvedValue({
        ...auction,
        status: 'CANCELLED',
      }),
    };

    useCase = new CancelAuctionUseCase(
      auctionRepository as unknown as AuctionRepository,
    );
  });

  it('returns null when the auction does not exist', async () => {
    auctionRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing-auction', 'seller-001');

    expect(result).toBeNull();
    expect(auctionRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('rejects cancellation by a user who is not the seller', async () => {
    await expect(
      useCase.execute(auction.id, 'another-user'),
    ).rejects.toMatchObject({
      message: 'AUCTION_NOT_OWNER',
    });

    expect(auctionRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('rejects cancellation when the auction has bids', async () => {
    auctionRepository.findById.mockResolvedValue({
      ...auction,
      currentBid: 150000,
    });

    await expect(
      useCase.execute(auction.id, auction.sellerId),
    ).rejects.toMatchObject({
      message: 'AUCTION_HAS_BIDS',
    });

    expect(auctionRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('cancels an auction without bids when requested by its seller', async () => {
    const result = await useCase.execute(auction.id, auction.sellerId);

    expect(auctionRepository.findById).toHaveBeenCalledWith(auction.id);
    expect(auctionRepository.updateStatus).toHaveBeenCalledWith(
      auction.id,
      'CANCELLED',
    );
    expect(result?.status).toBe('CANCELLED');
  });
});
