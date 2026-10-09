import { Auction } from '../entities/auction';

export type AuctionCreationRejectionReason =
  | 'INVALID_BASE_PRICE'
  | 'INVALID_MINIMUM_INCREMENT'
  | 'CLOSING_DATE_BEFORE_CREATION'
  | 'AUCTION_TOO_SHORT'
  | 'AUCTION_TOO_LONG';

export interface AuctionCreationValidationResult {
  valid: boolean;
  reason: AuctionCreationRejectionReason | null;
}

const MIN_AUCTION_DURATION_MS = 60 * 60 * 1000;
const MAX_AUCTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function validateAuctionCreation(
  basePrice: number,
  minimumIncrement: number,
  createdAt: Date,
  closesAt: Date,
): AuctionCreationValidationResult {
  if (basePrice <= 0) {
    return {
      valid: false,
      reason: 'INVALID_BASE_PRICE',
    };
  }

  if (minimumIncrement <= 0) {
    return {
      valid: false,
      reason: 'INVALID_MINIMUM_INCREMENT',
    };
  }

  if (
    Number.isNaN(createdAt.getTime()) ||
    Number.isNaN(closesAt.getTime())
  ) {
    return {
      valid: false,
      reason: 'CLOSING_DATE_BEFORE_CREATION',
    };
  }

  if (closesAt <= createdAt) {
    return {
      valid: false,
      reason: 'CLOSING_DATE_BEFORE_CREATION',
    };
  }

  const duration = closesAt.getTime() - createdAt.getTime();

  if (duration < MIN_AUCTION_DURATION_MS) {
    return {
      valid: false,
      reason: 'AUCTION_TOO_SHORT',
    };
  }

  if (duration > MAX_AUCTION_DURATION_MS) {
    return {
      valid: false,
      reason: 'AUCTION_TOO_LONG',
    };
  }

  return {
    valid: true,
    reason: null,
  };
}

export function canCancelAuction(auction: Auction): boolean {
  return auction.currentBid === null;
}