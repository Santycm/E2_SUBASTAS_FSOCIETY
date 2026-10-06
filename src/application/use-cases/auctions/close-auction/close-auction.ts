import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { BidRepository } from '../../../../domain/ports/bid.repository';

export class CloseAuctionUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly bidRepository: BidRepository,
  ) {}

  async execute(auction: Auction): Promise<Auction> {
    if (auction.status !== 'OPEN') {
      return auction;
    }

    if (auction.closesAt > new Date()) {
      return auction;
    }

    const highestBid =
      await this.bidRepository.findHighestAcceptedByAuctionId(
        auction.id,
      );

    if (!highestBid) {
      return this.auctionRepository.updateStatus(
        auction.id,
        'NO_BIDS',
      );
    }

    return this.auctionRepository.updateStatus(
      auction.id,
      'CLOSED',
    );
  }
}