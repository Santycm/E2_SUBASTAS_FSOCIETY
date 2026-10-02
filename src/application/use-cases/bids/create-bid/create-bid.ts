import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { BidRepository } from '../../../../domain/ports/bid.repository';
import { Bid } from '../../../../domain/entities/bid';
import { validateBid } from '../../../../domain/rules/bid.rules';
import { CreateBidDto } from './dto/create-bid.dto';

export interface CreateBidResult {
  bid: Bid;
  auctionId: string;
  bidderId: string;
  currentBid: number | null;
}

export class CreateBidUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly bidRepository: BidRepository,
  ) {}

  async execute(
    dto: CreateBidDto,
  ): Promise<CreateBidResult | null> {
    const auction = await this.auctionRepository.findById(
      dto.auctionId,
    );

    if (!auction) {
      return null;
    }

    const validation = validateBid(
      auction,
      dto.bidderId,
      dto.amount,
    );

    const existingBids = await this.bidRepository.findByAuctionId(
      dto.auctionId,
    );

    const bid: Bid = {
      id: `bid-${String(existingBids.length + 1).padStart(3, '0')}`,
      auctionId: dto.auctionId,
      bidderId: dto.bidderId,
      amount: dto.amount,
      status: validation.valid ? 'ACCEPTED' : 'REJECTED',
      rejectionReason: validation.reason,
      createdAt: new Date(),
    };

    await this.bidRepository.save(bid);

    if (validation.valid) {
      const updatedAuction = {
        ...auction,
        currentBid: dto.amount,
      };

      await this.auctionRepository.update(updatedAuction);
    }

    return {
      bid,
      auctionId: dto.auctionId,
      bidderId: dto.bidderId,
      currentBid: validation.valid
        ? dto.amount
        : auction.currentBid,
    };
  }
}