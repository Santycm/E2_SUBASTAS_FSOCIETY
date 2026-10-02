import { BidRepository } from '../../../../domain/ports/bid.repository';
import { Bid } from '../../../../domain/entities/bid';
import { bidsData } from '../data/bids.data';

export class MockBidRepository implements BidRepository {
  async findByAuctionId(auctionId: string): Promise<Bid[]> {
    return bidsData.filter(
      bid => bid.auctionId === auctionId,
    );
  }

  async findByBidderId(bidderId: string): Promise<Bid[]> {
    return bidsData.filter(
      bid => bid.bidderId === bidderId,
    );
  }

  async save(bid: Bid): Promise<Bid> {
    bidsData.push(bid);

    return bid;
  }
}