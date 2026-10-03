import { Auction } from '../../../src/domain/entities/auction';
import { validateBid } from '../../../src/domain/rules/bid.rules';

describe('validateBid', () => {
  const auction: Auction = {
    id: 'auction-1',
    title: 'MacBook Pro',
    description: 'MacBook Pro M3',
    categoryId: 'category-1',
    sellerId: 'seller-1',
    basePrice: 1000000,
    minimumIncrement: 100000,
    currentBid: null,
    status: 'OPEN',
    closesAt: new Date('2026-10-10T20:00:00Z'),
    createdAt: new Date('2026-10-01T20:00:00Z'),
  };

  it('should accept the first bid when it is equal to the base price', () => {
    const result = validateBid(
      auction,
      'bidder-1',
      1000000,
    );

    expect(result).toEqual({
      valid: true,
      reason: null,
    });
  });

  it('should accept the first bid when it is above the base price', () => {
    const result = validateBid(
      auction,
      'bidder-1',
      1200000,
    );

    expect(result).toEqual({
      valid: true,
      reason: null,
    });
  });

  it('should reject the first bid when it is below the base price', () => {
    const result = validateBid(
      auction,
      'bidder-1',
      900000,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AMOUNT_BELOW_MINIMUM',
    });
  });

  it('should reject a bid from the seller', () => {
    const result = validateBid(
      auction,
      'seller-1',
      1500000,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'SELLER_CANNOT_BID',
    });
  });

  it('should reject a bid below the minimum increment', () => {
    const auctionWithBid: Auction = {
      ...auction,
      currentBid: 1500000,
    };

    const result = validateBid(
      auctionWithBid,
      'bidder-1',
      1500000,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AMOUNT_BELOW_MINIMUM',
    });
  });

  it('should accept a bid equal to the current bid plus the minimum increment', () => {
    const auctionWithBid: Auction = {
      ...auction,
      currentBid: 1500000,
    };

    const result = validateBid(
      auctionWithBid,
      'bidder-1',
      1600000,
    );

    expect(result).toEqual({
      valid: true,
      reason: null,
    });
  });

  it('should reject bids when the auction is closed', () => {
    const closedAuction: Auction = {
      ...auction,
      status: 'CLOSED',
    };

    const result = validateBid(
      closedAuction,
      'bidder-1',
      1500000,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AUCTION_CLOSED',
    });
  });

  it('should reject bids when the auction is cancelled', () => {
    const cancelledAuction: Auction = {
      ...auction,
      status: 'CANCELLED',
    };

    const result = validateBid(
      cancelledAuction,
      'bidder-1',
      1500000,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AUCTION_CANCELLED',
    });
  });
});