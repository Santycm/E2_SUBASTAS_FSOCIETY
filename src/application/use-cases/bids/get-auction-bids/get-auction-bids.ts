import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { BidRepository } from '../../../../domain/ports/bid.repository';
import { Bid } from '../../../../domain/entities/bid';
import { GetAuctionBidsDto } from './dto/get-auction-bids.dto';

export interface GetAuctionBidsResult {
  bids: Bid[];
}

export class GetAuctionBidsUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly bidRepository: BidRepository,
  ) {}

  async execute(
    dto: GetAuctionBidsDto,
  ): Promise<GetAuctionBidsResult | null> {
    const auction = await this.auctionRepository.findById(
      dto.auctionId,
    );

    if (!auction) {
      return null;
    }

    const bids = await this.bidRepository.findByAuctionId(
      dto.auctionId,
    );

    return {
      bids,
    };
  }
}