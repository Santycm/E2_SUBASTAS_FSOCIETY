import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Auction } from '../../../src/domain/entities/auction';
import { Bid } from '../../../src/domain/entities/bid';
import { AuctionRepository } from '../../../src/domain/ports/auction.repository';
import { AuctionEventPublisher } from '../../../src/domain/ports/auction-event.publisher';
import { BidRepository } from '../../../src/domain/ports/bid.repository';
import { OrderRepository } from '../../../src/domain/ports/order.repository';
import { CreateBidUseCase } from '../../../src/application/use-cases/bids/create-bid/create-bid';

describe('CreateBidUseCase', () => {
  const now = new Date('2026-11-01T12:00:00.000Z');

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
    closesAt: new Date('2026-11-01T13:00:00.000Z'),
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
  };

  const highestBid: Bid = {
    id: 'bid-001',
    auctionId: auction.id,
    bidderId: 'buyer-001',
    amount: 150000,
    status: 'ACCEPTED',
    rejectionReason: null,
    createdAt: new Date('2026-11-01T11:30:00.000Z'),
  };

  let auctionRepository: {
    findById: ReturnType<typeof jest.fn>;
    updateStatus: ReturnType<typeof jest.fn>;
    updateCurrentBid: ReturnType<typeof jest.fn>;
  };

  let bidRepository: {
    save: ReturnType<typeof jest.fn>;
    findHighestAcceptedByAuctionId: ReturnType<typeof jest.fn>;
  };

  let orderRepository: {
    findByAuctionId: ReturnType<typeof jest.fn>;
    save: ReturnType<typeof jest.fn>;
  };

  let auctionEventPublisher: {
    publishBidPlaced: ReturnType<typeof jest.fn>;
    publishBidOutbid: ReturnType<typeof jest.fn>;
    publishAuctionClosed: ReturnType<typeof jest.fn>;
  };

  let useCase: CreateBidUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    auctionRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
      updateCurrentBid: jest.fn(),
    };

    bidRepository = {
      save: jest.fn(),
      findHighestAcceptedByAuctionId: jest.fn(),
    };

    orderRepository = {
      findByAuctionId: jest.fn(),
      save: jest.fn(),
    };

    auctionEventPublisher = {
      publishBidPlaced: jest.fn(),
      publishBidOutbid: jest.fn(),
      publishAuctionClosed: jest.fn(),
    };

    useCase = new CreateBidUseCase(
      auctionRepository as unknown as AuctionRepository,
      bidRepository as unknown as BidRepository,
      orderRepository as unknown as OrderRepository,
      auctionEventPublisher as unknown as AuctionEventPublisher,
    );

    auctionRepository.findById.mockResolvedValue(auction);

    bidRepository.findHighestAcceptedByAuctionId.mockResolvedValue(null);

    bidRepository.save.mockImplementation(async (data) => ({
      id: 'bid-new',
      ...data,
    }));

    auctionRepository.updateCurrentBid.mockResolvedValue({
      ...auction,
      currentBid: 110000,
    });

    auctionRepository.updateStatus.mockImplementation(
      async (_id, status) => ({
        ...auction,
        status,
      }),
    );

    orderRepository.findByAuctionId.mockResolvedValue(null);
    orderRepository.save.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when the auction does not exist', async () => {
    auctionRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      auctionId: 'missing-auction',
      bidderId: 'buyer-001',
      amount: 100000,
    });

    expect(result).toBeNull();
    expect(bidRepository.save).not.toHaveBeenCalled();
    expect(bidRepository.findHighestAcceptedByAuctionId).not.toHaveBeenCalled();
    expect(auctionRepository.updateCurrentBid).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishBidPlaced).not.toHaveBeenCalled();
  });

  it('accepts a valid first bid and publishes the bid event', async () => {
    const result = await useCase.execute({
      auctionId: auction.id,
      bidderId: 'buyer-001',
      amount: auction.basePrice,
    });

    expect(result?.bid.status).toBe('ACCEPTED');
    expect(result?.bid.rejectionReason).toBeNull();
    expect(result?.currentBid).toBe(auction.basePrice);

    expect(bidRepository.save).toHaveBeenCalledWith({
      auctionId: auction.id,
      bidderId: 'buyer-001',
      amount: auction.basePrice,
      status: 'ACCEPTED',
      rejectionReason: null,
      createdAt: now,
    });

    expect(auctionRepository.updateCurrentBid).toHaveBeenCalledWith(
      auction.id,
      auction.basePrice,
    );

    expect(auctionEventPublisher.publishBidPlaced).toHaveBeenCalledWith({
      auctionId: auction.id,
      bidderId: 'buyer-001',
      amount: auction.basePrice,
      currentBid: auction.basePrice,
    });

    expect(auctionEventPublisher.publishBidOutbid).not.toHaveBeenCalled();
  });

  it('publishes an outbid event when a different bidder takes the lead', async () => {
    const auctionWithBid = {
      ...auction,
      currentBid: highestBid.amount,
    };

    auctionRepository.findById.mockResolvedValue(auctionWithBid);
    bidRepository.findHighestAcceptedByAuctionId.mockResolvedValue(highestBid);

    const result = await useCase.execute({
      auctionId: auction.id,
      bidderId: 'buyer-002',
      amount: highestBid.amount + auction.minimumIncrement,
    });

    expect(result?.bid.status).toBe('ACCEPTED');

    expect(auctionEventPublisher.publishBidPlaced).toHaveBeenCalledWith({
      auctionId: auction.id,
      bidderId: 'buyer-002',
      amount: 160000,
      currentBid: 160000,
    });

    expect(auctionEventPublisher.publishBidOutbid).toHaveBeenCalledWith({
      auctionId: auction.id,
      outbidBidderId: highestBid.bidderId,
      currentBid: 160000,
    });
  });

  it('persists a rejected bid without updating the auction or publishing bid events', async () => {
    const result = await useCase.execute({
      auctionId: auction.id,
      bidderId: auction.sellerId,
      amount: auction.basePrice,
    });

    expect(result?.bid.status).toBe('REJECTED');
    expect(result?.bid.rejectionReason).toBe('SELLER_CANNOT_BID');

    expect(bidRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        auctionId: auction.id,
        bidderId: auction.sellerId,
        status: 'REJECTED',
        rejectionReason: 'SELLER_CANNOT_BID',
      }),
    );

    expect(auctionRepository.updateCurrentBid).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishBidPlaced).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishBidOutbid).not.toHaveBeenCalled();
  });

  it('rejects a bid below the required minimum', async () => {
    const auctionWithBid = {
      ...auction,
      currentBid: highestBid.amount,
    };

    auctionRepository.findById.mockResolvedValue(auctionWithBid);
    bidRepository.findHighestAcceptedByAuctionId.mockResolvedValue(highestBid);

    const result = await useCase.execute({
      auctionId: auction.id,
      bidderId: 'buyer-002',
      amount: highestBid.amount + auction.minimumIncrement - 1,
    });

    expect(result?.bid.status).toBe('REJECTED');
    expect(result?.bid.rejectionReason).toBe('AMOUNT_BELOW_MINIMUM');
    expect(result?.currentBid).toBe(highestBid.amount);
    expect(auctionRepository.updateCurrentBid).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishBidPlaced).not.toHaveBeenCalled();
  });

  it('rejects a bid from the current leading bidder', async () => {
    const auctionWithBid = {
      ...auction,
      currentBid: highestBid.amount,
    };

    auctionRepository.findById.mockResolvedValue(auctionWithBid);
    bidRepository.findHighestAcceptedByAuctionId.mockResolvedValue(highestBid);

    const result = await useCase.execute({
      auctionId: auction.id,
      bidderId: highestBid.bidderId,
      amount: highestBid.amount + auction.minimumIncrement,
    });

    expect(result?.bid.status).toBe('REJECTED');
    expect(result?.bid.rejectionReason).toBe('LEADING_BIDDER_CANNOT_OUTBID_SELF');
    expect(auctionRepository.updateCurrentBid).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishBidPlaced).not.toHaveBeenCalled();
  });

  it('closes an expired auction without bids and rejects the new bid', async () => {
    const expiredAuction = {
      ...auction,
      closesAt: new Date('2026-11-01T11:00:00.000Z'),
    };

    auctionRepository.findById.mockResolvedValue(expiredAuction);
    bidRepository.findHighestAcceptedByAuctionId.mockResolvedValue(null);
    auctionRepository.updateStatus.mockResolvedValue({
      ...expiredAuction,
      status: 'NO_BIDS',
    });

    const result = await useCase.execute({
      auctionId: auction.id,
      bidderId: 'buyer-001',
      amount: auction.basePrice,
    });

    expect(auctionRepository.updateStatus).toHaveBeenCalledWith(
      auction.id,
      'NO_BIDS',
    );

    expect(auctionEventPublisher.publishAuctionClosed).toHaveBeenCalledWith({
      auctionId: auction.id,
      status: 'NO_BIDS',
    });

    expect(result?.bid.status).toBe('REJECTED');
    expect(result?.bid.rejectionReason).toBe('AUCTION_NOT_OPEN');
    expect(auctionRepository.updateCurrentBid).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishBidPlaced).not.toHaveBeenCalled();
  });

  it('rejects a bid when the expired auction is closed with a winner', async () => {
    const expiredAuction = {
      ...auction,
      currentBid: highestBid.amount,
      closesAt: new Date('2026-11-01T11:00:00.000Z'),
    };

    auctionRepository.findById.mockResolvedValue(expiredAuction);
    bidRepository.findHighestAcceptedByAuctionId.mockResolvedValue(highestBid);
    auctionRepository.updateStatus.mockResolvedValue({
      ...expiredAuction,
      status: 'CLOSED',
    });

    const result = await useCase.execute({
      auctionId: auction.id,
      bidderId: 'buyer-002',
      amount: highestBid.amount + auction.minimumIncrement,
    });

    expect(auctionRepository.updateStatus).toHaveBeenCalledWith(
      auction.id,
      'CLOSED',
    );

    expect(orderRepository.save).toHaveBeenCalledWith({
      auctionId: auction.id,
      buyerId: highestBid.bidderId,
      amount: highestBid.amount,
      status: 'PENDING',
      createdAt: now,
      expiresAt: new Date('2026-11-03T12:00:00.000Z'),
    });

    expect(result?.bid.status).toBe('REJECTED');
    expect(result?.bid.rejectionReason).toBe('AUCTION_CLOSED');
    expect(auctionRepository.updateCurrentBid).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishBidPlaced).not.toHaveBeenCalled();
  });
});
