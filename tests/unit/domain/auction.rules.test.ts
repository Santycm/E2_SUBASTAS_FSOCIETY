import { describe, expect, it } from '@jest/globals';
import { Auction } from '../../../src/domain/entities/auction';
import {
  canCancelAuction,
  validateAuctionCreation,
} from '../../../src/domain/rules/auction.rules';

describe('validateAuctionCreation', () => {
  const createdAt = new Date('2026-10-01T10:00:00.000Z');

  const validate = (overrides?: {
    basePrice?: number;
    minimumIncrement?: number;
    createdAt?: Date;
    closesAt?: Date;
  }) =>
    validateAuctionCreation(
      overrides?.basePrice ?? 100000,
      overrides?.minimumIncrement ?? 10000,
      overrides?.createdAt ?? createdAt,
      overrides?.closesAt ?? new Date('2026-10-01T12:00:00.000Z'),
    );

  it('accepts a valid auction', () => {
    expect(validate()).toEqual({
      valid: true,
      reason: null,
    });
  });

  describe('base price', () => {
    it.each([0, -1, -100000])(
      'rejects a base price of %s',
      (basePrice) => {
        expect(validate({ basePrice })).toEqual({
          valid: false,
          reason: 'INVALID_BASE_PRICE',
        });
      },
    );
  });

  describe('minimum increment', () => {
    it.each([0, -1, -10000])(
      'rejects a minimum increment of %s',
      (minimumIncrement) => {
        expect(validate({ minimumIncrement })).toEqual({
          valid: false,
          reason: 'INVALID_MINIMUM_INCREMENT',
        });
      },
    );
  });

  describe('closing date', () => {
    it('rejects a closing date before creation', () => {
      expect(
        validate({
          closesAt: new Date('2026-10-01T09:00:00.000Z'),
        }),
      ).toEqual({
        valid: false,
        reason: 'CLOSING_DATE_BEFORE_CREATION',
      });
    });

    it('rejects a closing date equal to creation', () => {
      expect(
        validate({
          closesAt: new Date(createdAt),
        }),
      ).toEqual({
        valid: false,
        reason: 'CLOSING_DATE_BEFORE_CREATION',
      });
    });

    it('rejects an invalid creation date', () => {
      expect(
        validate({
          createdAt: new Date(Number.NaN),
        }),
      ).toEqual({
        valid: false,
        reason: 'CLOSING_DATE_BEFORE_CREATION',
      });
    });

    it('rejects an invalid closing date', () => {
      expect(
        validate({
          closesAt: new Date(Number.NaN),
        }),
      ).toEqual({
        valid: false,
        reason: 'CLOSING_DATE_BEFORE_CREATION',
      });
    });
  });

  describe('auction duration', () => {
    it('rejects a duration shorter than one hour', () => {
      expect(
        validate({
          closesAt: new Date('2026-10-01T10:59:59.999Z'),
        }),
      ).toEqual({
        valid: false,
        reason: 'AUCTION_TOO_SHORT',
      });
    });

    it('accepts a duration of exactly one hour', () => {
      expect(
        validate({
          closesAt: new Date('2026-10-01T11:00:00.000Z'),
        }),
      ).toEqual({
        valid: true,
        reason: null,
      });
    });

    it('accepts a duration of exactly thirty days', () => {
      expect(
        validate({
          closesAt: new Date('2026-10-31T10:00:00.000Z'),
        }),
      ).toEqual({
        valid: true,
        reason: null,
      });
    });

    it('rejects a duration longer than thirty days', () => {
      expect(
        validate({
          closesAt: new Date('2026-10-31T10:00:00.001Z'),
        }),
      ).toEqual({
        valid: false,
        reason: 'AUCTION_TOO_LONG',
      });
    });
  });
});

describe('canCancelAuction', () => {
  const auction: Auction = {
    id: 'auction-001',
    title: 'Test auction',
    description: 'Test description',
    categoryId: 'category-001',
    sellerId: 'seller-001',
    basePrice: 100000,
    minimumIncrement: 10000,
    currentBid: null,
    status: 'OPEN',
    closesAt: new Date('2026-10-01T12:00:00.000Z'),
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
  };

  it('allows cancellation when there are no bids', () => {
    expect(canCancelAuction(auction)).toBe(true);
  });

  it('rejects cancellation when a current bid exists', () => {
    expect(
      canCancelAuction({
        ...auction,
        currentBid: 150000,
      }),
    ).toBe(false);
  });
});
