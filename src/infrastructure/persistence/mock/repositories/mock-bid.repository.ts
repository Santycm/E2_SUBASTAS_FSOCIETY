import { Bid } from '../../../../domain/entities/bid';
import {
  BidRepository,
  CreateBidData,
} from '../../../../domain/ports/bid.repository';
import { bidsData } from '../data/bids.data';

export class MockBidRepository implements BidRepository {
  async findByAuctionId(auctionId: string): Promise<Bid[]> {
    return bidsData.filter(
      (bid) => bid.auctionId === auctionId,
    );
  }

  async findByBidderId(bidderId: string): Promise<Bid[]> {
    return bidsData.filter(
      (bid) => bid.bidderId === bidderId,
    );
  }

  async findHighestAcceptedByAuctionId(
    auctionId: string,
  ): Promise<Bid | null> {
    const acceptedBids = bidsData.filter(
      (bid) =>
        bid.auctionId === auctionId &&
        bid.status === 'ACCEPTED',
    );

    if (acceptedBids.length === 0) {
      return null;
    }

    return acceptedBids.reduce((highest, bid) =>
      bid.amount > highest.amount ? bid : highest,
    );
  }

  async save(data: CreateBidData): Promise<Bid> {
    const bid: Bid = {
      id: `bid-${String(bidsData.length + 1).padStart(3, '0')}`,
      ...data,
    };

    bidsData.push(bid);

    return bid;
  }
}