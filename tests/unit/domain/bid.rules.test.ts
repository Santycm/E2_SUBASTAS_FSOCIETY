import { Auction } from '../../../src/domain/entities/auction';
import { validateBid } from '../../../src/domain/rules/bid.rules';

const auction: Auction = {
  id: 'auction-1',
  title: 'Laptop',
  description: 'Laptop usada',
  categoryId: 'category-1',
  sellerId: 'seller-1',
  basePrice: 100000,
  minimumIncrement: 10000,
  currentBid: null,
  status: 'OPEN',
  closesAt: new Date('2026-12-01T12:00:00Z'),
  createdAt: new Date('2026-11-01T12:00:00Z'),
};

describe('validateBid', () => {
  it('accepts the first bid at the base price', () => {
    const result = validateBid(
      auction,
      'bidder-1',
      100000,
      null,
    );

    expect(result).toEqual({
      valid: true,
      reason: null,
    });
  });

  it('rejects a bid below the base price', () => {
    const result = validateBid(
      auction,
      'bidder-1',
      90000,
      null,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AMOUNT_BELOW_MINIMUM',
    });
  });

  it('rejects a bid from the seller', () => {
    const result = validateBid(
      auction,
      'seller-1',
      100000,
      null,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'SELLER_CANNOT_BID',
    });
  });

  it('rejects a bid when the auction is cancelled', () => {
    const result = validateBid(
      {
        ...auction,
        status: 'CANCELLED',
      },
      'bidder-1',
      100000,
      null,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AUCTION_CANCELLED',
    });
  });

  it('rejects a bid when the auction is closed', () => {
    const result = validateBid(
      {
        ...auction,
        status: 'CLOSED',
      },
      'bidder-1',
      100000,
      null,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AUCTION_CLOSED',
    });
  });

  it('rejects a bid when the auction is not open', () => {
    const result = validateBid(
      {
        ...auction,
        status: 'NO_BIDS',
      },
      'bidder-1',
      100000,
      null,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AUCTION_NOT_OPEN',
    });
  });

  it('rejects a bid below the minimum increment', () => {
    const result = validateBid(
      {
        ...auction,
        currentBid: 150000,
      },
      'bidder-1',
      155000,
      'bidder-2',
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AMOUNT_BELOW_MINIMUM',
    });
  });

  it('accepts a bid that meets the minimum increment', () => {
    const result = validateBid(
      {
        ...auction,
        currentBid: 150000,
      },
      'bidder-1',
      160000,
      'bidder-2',
    );

    expect(result).toEqual({
      valid: true,
      reason: null,
    });
  });

  it('rejects the leading bidder from outbidding themselves', () => {
    const result = validateBid(
      {
        ...auction,
        currentBid: 150000,
      },
      'bidder-1',
      160000,
      'bidder-1',
    );

    expect(result).toEqual({
      valid: false,
      reason: 'LEADING_BIDDER_CANNOT_OUTBID_SELF',
    });
  });
});