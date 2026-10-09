import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { AuctionEventPublisher } from '../../../../domain/ports/auction-event.publisher';
import { BidRepository } from '../../../../domain/ports/bid.repository';
import { OrderRepository } from '../../../../domain/ports/order.repository';
import { Bid } from '../../../../domain/entities/bid';
import { validateBid } from '../../../../domain/rules/bid.rules';
import { CreateBidDto } from './dto/create-bid.dto';
import { CloseAuctionUseCase } from '../../auctions/close-auction/close-auction';

export interface CreateBidResult {
  bid: Bid;
  auctionId: string;
  bidderId: string;
  currentBid: number | null;
}

export class CreateBidUseCase {
  private readonly closeAuctionUseCase: CloseAuctionUseCase;

  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly bidRepository: BidRepository,
    private readonly orderRepository: OrderRepository,
    private readonly auctionEventPublisher: AuctionEventPublisher,
  ) {
    this.closeAuctionUseCase = new CloseAuctionUseCase(
      auctionRepository,
      bidRepository,
      orderRepository,
      auctionEventPublisher,
    );
  }

  async execute(
    dto: CreateBidDto,
  ): Promise<CreateBidResult | null> {
    const auction = await this.auctionRepository.findById(
      dto.auctionId,
    );

    if (!auction) {
      return null;
    }

    const currentAuction =
      await this.closeAuctionUseCase.execute(auction);

    const highestBid =
      await this.bidRepository.findHighestAcceptedByAuctionId(
        dto.auctionId,
      );

    const validation = validateBid(
      currentAuction,
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
        currentAuction.id,
        dto.amount,
      );

      this.auctionEventPublisher.publishBidPlaced({
        auctionId: dto.auctionId,
        bidderId: dto.bidderId,
        amount: dto.amount,
        currentBid: dto.amount,
      });

      if (
        highestBid &&
        highestBid.bidderId !== dto.bidderId
      ) {
        this.auctionEventPublisher.publishBidOutbid({
          auctionId: dto.auctionId,
          outbidBidderId: highestBid.bidderId,
          currentBid: dto.amount,
        });
      }
    }

    return {
      bid: savedBid,
      auctionId: dto.auctionId,
      bidderId: dto.bidderId,
      currentBid: validation.valid
        ? dto.amount
        : currentAuction.currentBid,
    };
  }
}