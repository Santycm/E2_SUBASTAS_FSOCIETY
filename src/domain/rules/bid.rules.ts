import { Auction } from '../entities/auction';
import { BidRejectionReason } from '../entities/bid';

export interface BidValidationResult {
  valid: boolean;
  reason: BidRejectionReason | null;
}

export function validateBid(
  auction: Auction,
  bidderId: string,
  amount: number,
  currentBidderId: string | null,
): BidValidationResult {
  if (auction.status === 'CANCELLED') {
    return {
      valid: false,
      reason: 'AUCTION_CANCELLED',
    };
  }

  if (auction.status === 'CLOSED') {
    return {
      valid: false,
      reason: 'AUCTION_CLOSED',
    };
  }

  if (auction.status !== 'OPEN') {
    return {
      valid: false,
      reason: 'AUCTION_NOT_OPEN',
    };
  }

  if (auction.sellerId === bidderId) {
    return {
      valid: false,
      reason: 'SELLER_CANNOT_BID',
    };
  }

  if (currentBidderId === bidderId) {
    return {
      valid: false,
      reason: 'LEADING_BIDDER_CANNOT_OUTBID_SELF',
    };
  }

  const minimumAmount =
    auction.currentBid === null
      ? auction.basePrice
      : auction.currentBid + auction.minimumIncrement;

  if (amount < minimumAmount) {
    return {
      valid: false,
      reason: 'AMOUNT_BELOW_MINIMUM',
    };
  }

  return {
    valid: true,
    reason: null,
  };
}

