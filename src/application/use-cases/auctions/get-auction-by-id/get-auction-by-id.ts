import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { BidRepository } from '../../../../domain/ports/bid.repository';
import { CloseAuctionUseCase } from '../close-auction/close-auction';

export class GetAuctionByIdUseCase {
  private readonly closeAuctionUseCase: CloseAuctionUseCase;

  constructor(
    private readonly auctionRepository: AuctionRepository,
    bidRepository: BidRepository,
  ) {
    this.closeAuctionUseCase = new CloseAuctionUseCase(
      auctionRepository,
      bidRepository,
    );
  }

  async execute(id: string): Promise<Auction | null> {
    const auction = await this.auctionRepository.findById(id);

    if (!auction) {
      return null;
    }

    return this.closeAuctionUseCase.execute(auction);
  }
}