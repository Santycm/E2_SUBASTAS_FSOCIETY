import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Auction } from '../../../src/domain/entities/auction';
import { Bid } from '../../../src/domain/entities/bid';
import { AuctionRepository } from '../../../src/domain/ports/auction.repository';
import { AuctionEventPublisher } from '../../../src/domain/ports/auction-event.publisher';
import { BidRepository } from '../../../src/domain/ports/bid.repository';
import { OrderRepository } from '../../../src/domain/ports/order.repository';
import { CloseAuctionUseCase } from '../../../src/application/use-cases/auctions/close-auction/close-auction';

describe('CloseAuctionUseCase', () => {
  const now = new Date('2026-11-01T12:00:00.000Z');

  const auction: Auction = {
    id: 'auction-001',
    title: 'Laptop',
    description: 'Laptop usada',
    categoryId: 'category-001',
    sellerId: 'seller-001',
    basePrice: 100000,
    minimumIncrement: 10000,
    currentBid: 160000,
    status: 'OPEN',
    closesAt: new Date('2026-11-01T11:00:00.000Z'),
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
  };

  const highestBid: Bid = {
    id: 'bid-001',
    auctionId: auction.id,
    bidderId: 'buyer-001',
    amount: 160000,
    status: 'ACCEPTED',
    rejectionReason: null,
    createdAt: new Date('2026-11-01T10:30:00.000Z'),
  };

  let auctionRepository: {
    updateStatus: ReturnType<typeof jest.fn>;
  };

  let bidRepository: {
    findHighestAcceptedByAuctionId: ReturnType<typeof jest.fn>;
  };

  let orderRepository: {
    findByAuctionId: ReturnType<typeof jest.fn>;
    save: ReturnType<typeof jest.fn>;
  };

  let auctionEventPublisher: {
    publishAuctionClosed: ReturnType<typeof jest.fn>;
  };

  let useCase: CloseAuctionUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    auctionRepository = {
      updateStatus: jest.fn(),
    };

    bidRepository = {
      findHighestAcceptedByAuctionId: jest.fn(),
    };

    orderRepository = {
      findByAuctionId: jest.fn(),
      save: jest.fn(),
    };

    auctionEventPublisher = {
      publishAuctionClosed: jest.fn(),
    };

    useCase = new CloseAuctionUseCase(
      auctionRepository as unknown as AuctionRepository,
      bidRepository as unknown as BidRepository,
      orderRepository as unknown as OrderRepository,
      auctionEventPublisher as unknown as AuctionEventPublisher,
    );

    orderRepository.findByAuctionId.mockResolvedValue(null);
    orderRepository.save.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not close an auction that has not expired', async () => {
    const openAuction: Auction = {
      ...auction,
      closesAt: new Date('2026-11-01T12:01:00.000Z'),
    };

    const result = await useCase.execute(openAuction);

    expect(result).toEqual(openAuction);
    expect(auctionRepository.updateStatus).not.toHaveBeenCalled();
    expect(bidRepository.findHighestAcceptedByAuctionId).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishAuctionClosed).not.toHaveBeenCalled();
  });

  it('does not process an auction that is already closed', async () => {
    const closedAuction: Auction = {
      ...auction,
      status: 'CLOSED',
    };

    const result = await useCase.execute(closedAuction);

    expect(result).toEqual(closedAuction);
    expect(auctionRepository.updateStatus).not.toHaveBeenCalled();
    expect(bidRepository.findHighestAcceptedByAuctionId).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishAuctionClosed).not.toHaveBeenCalled();
  });

  it('marks an expired auction without accepted bids as NO_BIDS', async () => {
    bidRepository.findHighestAcceptedByAuctionId.mockResolvedValue(null);

    const noBidsAuction: Auction = {
      ...auction,
      currentBid: null,
    };

    auctionRepository.updateStatus.mockResolvedValue({
      ...noBidsAuction,
      status: 'NO_BIDS',
    });

    const result = await useCase.execute(noBidsAuction);

    expect(
      bidRepository.findHighestAcceptedByAuctionId,
    ).toHaveBeenCalledWith(noBidsAuction.id);

    expect(auctionRepository.updateStatus).toHaveBeenCalledWith(
      noBidsAuction.id,
      'NO_BIDS',
    );

    expect(result.status).toBe('NO_BIDS');
    expect(orderRepository.findByAuctionId).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();

    expect(auctionEventPublisher.publishAuctionClosed).toHaveBeenCalledWith({
      auctionId: noBidsAuction.id,
      status: 'NO_BIDS',
    });
  });

  it('closes an expired auction and creates a payment order for the highest bidder', async () => {
    bidRepository.findHighestAcceptedByAuctionId.mockResolvedValue(highestBid);

    auctionRepository.updateStatus.mockResolvedValue({
      ...auction,
      status: 'CLOSED',
    });

    const result = await useCase.execute(auction);

    expect(auctionRepository.updateStatus).toHaveBeenCalledWith(
      auction.id,
      'CLOSED',
    );

    expect(orderRepository.findByAuctionId).toHaveBeenCalledWith(auction.id);

    expect(orderRepository.save).toHaveBeenCalledWith({
      auctionId: auction.id,
      buyerId: highestBid.bidderId,
      amount: highestBid.amount,
      status: 'PENDING',
      createdAt: now,
      expiresAt: new Date('2026-11-03T12:00:00.000Z'),
    });

    expect(result.status).toBe('CLOSED');

    expect(auctionEventPublisher.publishAuctionClosed).toHaveBeenCalledWith({
      auctionId: auction.id,
      status: 'CLOSED',
      winnerId: highestBid.bidderId,
    });
  });

  it('does not create another payment order when one already exists', async () => {
    bidRepository.findHighestAcceptedByAuctionId.mockResolvedValue(highestBid);

    auctionRepository.updateStatus.mockResolvedValue({
      ...auction,
      status: 'CLOSED',
    });

    orderRepository.findByAuctionId.mockResolvedValue({
      id: 'order-existing',
    });

    const result = await useCase.execute(auction);

    expect(orderRepository.findByAuctionId).toHaveBeenCalledWith(auction.id);
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(result.status).toBe('CLOSED');
  });
});
