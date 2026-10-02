import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';

export class CancelAuctionUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
  ) {}

  async execute(id: string): Promise<Auction | null> {
    const auction = await this.auctionRepository.findById(id);

    if (!auction) {
      return null;
    }

    const cancelledAuction: Auction = {
      ...auction,
      status: 'CANCELLED',
    };

    return this.auctionRepository.update(cancelledAuction);
  }
}