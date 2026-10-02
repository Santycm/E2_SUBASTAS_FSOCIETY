import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';

export class GetAuctionByIdUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
  ) {}

  async execute(id: string): Promise<Auction | null> {
    return this.auctionRepository.findById(id);
  }
}