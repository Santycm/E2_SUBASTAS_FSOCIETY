import { describe, expect, it, jest } from '@jest/globals';
import { GetAuctionsUseCase } from '../../../src/application/use-cases/auctions/get-auctions/get-auctions';
import { AuctionRepository } from '../../../src/domain/ports/auction.repository';
import { BidRepository } from '../../../src/domain/ports/bid.repository';
import { OrderRepository } from '../../../src/domain/ports/order.repository';
import { AuctionEventPublisher } from '../../../src/domain/ports/auction-event.publisher';

describe('GetAuctionsUseCase', () => {
  function createUseCase() {
    const auctionRepository = { findAll: jest.fn() };
    const bidRepository = { findHighestAcceptedByAuctionId: jest.fn() };
    const orderRepository = { findByAuctionId: jest.fn(), save: jest.fn() };
    const auctionEventPublisher = { publishAuctionClosed: jest.fn() };

    const useCase = new GetAuctionsUseCase(
      auctionRepository as unknown as AuctionRepository,
      bidRepository as unknown as BidRepository,
      orderRepository as unknown as OrderRepository,
      auctionEventPublisher as unknown as AuctionEventPublisher,
    );

    return { useCase, auctionRepository, bidRepository, orderRepository };
  }

  it('uses default pagination and returns an empty result', async () => {
    const { useCase, auctionRepository } = createUseCase();
    auctionRepository.findAll.mockResolvedValue({ data: [], total: 0 });

    const result = await useCase.execute({});

    expect(auctionRepository.findAll).toHaveBeenCalledWith({
      categoryId: undefined,
      status: undefined,
      page: 1,
      limit: 10,
    });
    expect(result).toEqual({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
  });

  it('forwards filters and pagination while returning open auctions', async () => {
    const { useCase, auctionRepository, bidRepository, orderRepository } = createUseCase();
    const auctions = [
      {
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
      },
    ];
    auctionRepository.findAll.mockResolvedValue({ data: auctions, total: 21 });

    const result = await useCase.execute({
      categoryId: 'category-1',
      status: 'OPEN',
      page: 3,
      limit: 10,
    });

    expect(auctionRepository.findAll).toHaveBeenCalledWith({
      categoryId: 'category-1',
      status: 'OPEN',
      page: 3,
      limit: 10,
    });
    expect(result).toEqual({
      data: auctions,
      pagination: { page: 3, limit: 10, total: 21, totalPages: 3 },
    });
    expect(bidRepository.findHighestAcceptedByAuctionId).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('uses provided page and limit when only those values are supplied', async () => {
    const { useCase, auctionRepository } = createUseCase();
    auctionRepository.findAll.mockResolvedValue({ data: [], total: 1 });

    const result = await useCase.execute({ page: 2, limit: 1 });

    expect(auctionRepository.findAll).toHaveBeenCalledWith({
      categoryId: undefined,
      status: undefined,
      page: 2,
      limit: 1,
    });
    expect(result.pagination.totalPages).toBe(1);
  });
});
