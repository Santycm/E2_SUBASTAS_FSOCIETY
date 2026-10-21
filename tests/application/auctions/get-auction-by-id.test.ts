import { describe, expect, it, jest } from '@jest/globals';
import { GetAuctionByIdUseCase } from '../../../src/application/use-cases/auctions/get-auction-by-id/get-auction-by-id';
import { AuctionRepository } from '../../../src/domain/ports/auction.repository';
import { BidRepository } from '../../../src/domain/ports/bid.repository';
import { OrderRepository } from '../../../src/domain/ports/order.repository';
import { AuctionEventPublisher } from '../../../src/domain/ports/auction-event.publisher';

describe('GetAuctionByIdUseCase', () => {
  function createUseCase() {
    const auctionRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    const bidRepository = {
      findHighestAcceptedByAuctionId: jest.fn(),
    };
    const orderRepository = {
      findByAuctionId: jest.fn(),
      save: jest.fn(),
    };
    const auctionEventPublisher = { publishAuctionClosed: jest.fn() };

    const useCase = new GetAuctionByIdUseCase(
      auctionRepository as unknown as AuctionRepository,
      bidRepository as unknown as BidRepository,
      orderRepository as unknown as OrderRepository,
      auctionEventPublisher as unknown as AuctionEventPublisher,
    );

    return { useCase, auctionRepository, bidRepository, orderRepository, auctionEventPublisher };
  }

  it('returns null when the auction does not exist', async () => {
    const { useCase, auctionRepository, bidRepository } = createUseCase();
    auctionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-auction')).resolves.toBeNull();
    expect(bidRepository.findHighestAcceptedByAuctionId).not.toHaveBeenCalled();
  });

  it('returns an existing auction that has not reached its closing time', async () => {
    const { useCase, auctionRepository, bidRepository, orderRepository, auctionEventPublisher } = createUseCase();
    const auction = {
      id: 'auction-1',
      title: 'Laptop',
      description: 'Used laptop',
      categoryId: 'category-1',
      sellerId: 'seller-1',
      basePrice: 100,
      minimumIncrement: 10,
      currentBid: null,
      status: 'OPEN' as const,
      closesAt: new Date('2099-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    auctionRepository.findById.mockResolvedValue(auction);

    await expect(useCase.execute(auction.id)).resolves.toEqual(auction);
    expect(bidRepository.findHighestAcceptedByAuctionId).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishAuctionClosed).not.toHaveBeenCalled();
  });
});
