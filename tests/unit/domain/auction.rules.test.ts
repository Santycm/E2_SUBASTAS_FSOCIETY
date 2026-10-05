import {
  canCancelAuction,
  validateAuctionCreation,
} from '../../../src/domain/rules/auction.rules';
import { Auction } from '../../../src/domain/entities/auction';

describe('validateAuctionCreation', () => {
  const createdAt = new Date('2026-10-01T10:00:00.000Z');

  it('accepts a valid auction', () => {
    const closesAt = new Date('2026-10-01T12:00:00.000Z');

    const result = validateAuctionCreation(
      100000,
      10000,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: true,
      reason: null,
    });
  });

  it('rejects a base price equal to zero', () => {
    const closesAt = new Date('2026-10-01T12:00:00.000Z');

    const result = validateAuctionCreation(
      0,
      10000,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'INVALID_BASE_PRICE',
    });
  });

  it('rejects a negative base price', () => {
    const closesAt = new Date('2026-10-01T12:00:00.000Z');

    const result = validateAuctionCreation(
      -100,
      10000,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'INVALID_BASE_PRICE',
    });
  });

  it('rejects a minimum increment equal to zero', () => {
    const closesAt = new Date('2026-10-01T12:00:00.000Z');

    const result = validateAuctionCreation(
      100000,
      0,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'INVALID_MINIMUM_INCREMENT',
    });
  });

  it('rejects a negative minimum increment', () => {
    const closesAt = new Date('2026-10-01T12:00:00.000Z');

    const result = validateAuctionCreation(
      100000,
      -100,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'INVALID_MINIMUM_INCREMENT',
    });
  });

  it('rejects a closing date before creation', () => {
    const closesAt = new Date('2026-10-01T09:00:00.000Z');

    const result = validateAuctionCreation(
      100000,
      10000,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'CLOSING_DATE_BEFORE_CREATION',
    });
  });

  it('rejects a closing date equal to creation date', () => {
    const closesAt = new Date(createdAt);

    const result = validateAuctionCreation(
      100000,
      10000,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'CLOSING_DATE_BEFORE_CREATION',
    });
  });

  it('rejects an auction shorter than one hour', () => {
    const closesAt = new Date('2026-10-01T10:59:59.999Z');

    const result = validateAuctionCreation(
      100000,
      10000,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AUCTION_TOO_SHORT',
    });
  });

  it('accepts an auction of exactly one hour', () => {
    const closesAt = new Date('2026-10-01T11:00:00.000Z');

    const result = validateAuctionCreation(
      100000,
      10000,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: true,
      reason: null,
    });
  });

  it('accepts an auction of exactly thirty days', () => {
    const closesAt = new Date('2026-10-31T10:00:00.000Z');

    const result = validateAuctionCreation(
      100000,
      10000,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: true,
      reason: null,
    });
  });

  it('rejects an auction longer than thirty days', () => {
    const closesAt = new Date('2026-10-31T10:00:00.001Z');

    const result = validateAuctionCreation(
      100000,
      10000,
      createdAt,
      closesAt,
    );

    expect(result).toEqual({
      valid: false,
      reason: 'AUCTION_TOO_LONG',
    });
  });
});

describe('canCancelAuction', () => {
  const baseAuction: Auction = {
    id: 'auction-001',
    title: 'Test auction',
    description: 'Test description',
    categoryId: 'category-001',
    sellerId: 'user-001',
    basePrice: 100000,
    minimumIncrement: 10000,
    currentBid: null,
    status: 'OPEN',
    closesAt: new Date('2026-10-01T12:00:00.000Z'),
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
  };

  it('allows cancellation when there are no bids', () => {
    expect(canCancelAuction(baseAuction)).toBe(true);
  });

  it('rejects cancellation when there is a current bid', () => {
    const auction: Auction = {
      ...baseAuction,
      currentBid: 150000,
    };

    expect(canCancelAuction(auction)).toBe(false);
  });
});