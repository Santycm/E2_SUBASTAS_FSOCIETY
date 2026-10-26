import { describe, expect, it, jest, afterEach } from '@jest/globals';
import {
  calculateOrderExpiration,
  isOrderExpired,
  ORDER_PAYMENT_DURATION_MS,
} from '../../../src/domain/rules/order.rules';

describe('calculateOrderExpiration', () => {
  it('sets expiration to 48 hours after creation', () => {
    const createdAt = new Date('2026-11-01T12:00:00.000Z');

    expect(calculateOrderExpiration(createdAt)).toEqual(
      new Date('2026-11-03T12:00:00.000Z'),
    );
  });

  it('adds the configured payment duration', () => {
    const createdAt = new Date('2026-11-01T12:00:00.000Z');

    expect(
      calculateOrderExpiration(createdAt).getTime() -
        createdAt.getTime(),
    ).toBe(ORDER_PAYMENT_DURATION_MS);
  });
});

describe('isOrderExpired', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns true when expiration is before the current time', () => {
    expect(
      isOrderExpired(
        new Date('2026-11-01T11:59:59.999Z'),
        new Date('2026-11-01T12:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('returns true when expiration equals the current time', () => {
    const now = new Date('2026-11-01T12:00:00.000Z');

    expect(isOrderExpired(now, now)).toBe(true);
  });

  it('returns false when expiration is in the future', () => {
    expect(
      isOrderExpired(
        new Date('2026-11-01T12:00:01.000Z'),
        new Date('2026-11-01T12:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('uses the current time when now is omitted', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-01T12:00:00.000Z'));

    expect(
      isOrderExpired(new Date('2026-11-01T11:00:00.000Z')),
    ).toBe(true);

    expect(
      isOrderExpired(new Date('2026-11-01T13:00:00.000Z')),
    ).toBe(false);
  });
});
