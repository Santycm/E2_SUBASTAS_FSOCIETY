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

    const highestBid =
      await this.bidRepository.findHighestAcceptedByAuctionId(
        dto.auctionId,
      );

    const validation = validateBid(
      auction,
      dto.bidderId,
      dto.amount,
      highestBid?.bidderId ?? null,
    );

    const savedBid = await this.bidRepository.save({
      auctionId: dto.auctionId,
      bidderId: dto.bidderId,
      amount: dto.amount,
      status: validation.valid ? 'ACCEPTED' : 'REJECTED',
      rejectionReason: validation.reason,
      createdAt: new Date(),
    });

    if (validation.valid) {
      await this.auctionRepository.updateCurrentBid(
        auction.id,
        dto.amount,
      );
    }

    return {
      bid: savedBid,
      auctionId: dto.auctionId,
      bidderId: dto.bidderId,
      currentBid: validation.valid
        ? dto.amount
        : auction.currentBid,
    };
  }
}