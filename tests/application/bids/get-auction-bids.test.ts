import { describe, expect, it, jest } from '@jest/globals';
import { GetAuctionBidsUseCase } from '../../../src/application/use-cases/bids/get-auction-bids/get-auction-bids';
import { AuctionRepository } from '../../../src/domain/ports/auction.repository';
import { BidRepository } from '../../../src/domain/ports/bid.repository';

describe('GetAuctionBidsUseCase', () => {
  function createUseCase() {
    const auctionRepository = { findById: jest.fn() };
    const bidRepository = { findByAuctionId: jest.fn() };

    const useCase = new GetAuctionBidsUseCase(
      auctionRepository as unknown as AuctionRepository,
      bidRepository as unknown as BidRepository,
    );

    return { useCase, auctionRepository, bidRepository };
  }

  it('returns null when the auction does not exist', async () => {
    const { useCase, auctionRepository, bidRepository } = createUseCase();
    auctionRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ auctionId: 'missing-auction' });

    expect(result).toBeNull();
    expect(auctionRepository.findById).toHaveBeenCalledWith('missing-auction');
    expect(bidRepository.findByAuctionId).not.toHaveBeenCalled();
  });

  it('returns the bids when the auction exists', async () => {
    const { useCase, auctionRepository, bidRepository } = createUseCase();
    const auction = { id: 'auction-1' };
    const bids = [
      { id: 'bid-1', auctionId: 'auction-1', bidderId: 'buyer-1', amount: 100, status: 'ACCEPTED', rejectionReason: null, createdAt: new Date() },
      { id: 'bid-2', auctionId: 'auction-1', bidderId: 'buyer-2', amount: 120, status: 'ACCEPTED', rejectionReason: null, createdAt: new Date() },
    ];

    auctionRepository.findById.mockResolvedValue(auction);
    bidRepository.findByAuctionId.mockResolvedValue(bids);

    const result = await useCase.execute({ auctionId: 'auction-1' });

    expect(bidRepository.findByAuctionId).toHaveBeenCalledWith('auction-1');
    expect(result).toEqual({ bids });
  });

  it('returns an empty list when the auction has no bids', async () => {
    const { useCase, auctionRepository, bidRepository } = createUseCase();
    auctionRepository.findById.mockResolvedValue({ id: 'auction-1' });
    bidRepository.findByAuctionId.mockResolvedValue([]);

    await expect(
      useCase.execute({ auctionId: 'auction-1' }),
    ).resolves.toEqual({ bids: [] });
  });
});
