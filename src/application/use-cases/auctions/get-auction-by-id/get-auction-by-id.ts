import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { AuctionEventPublisher } from '../../../../domain/ports/auction-event.publisher';
import { BidRepository } from '../../../../domain/ports/bid.repository';
import { OrderRepository } from '../../../../domain/ports/order.repository';
import { CloseAuctionUseCase } from '../close-auction/close-auction';

export class GetAuctionByIdUseCase {
  private readonly closeAuctionUseCase: CloseAuctionUseCase;

  constructor(
    private readonly auctionRepository: AuctionRepository,
    bidRepository: BidRepository,
    orderRepository: OrderRepository,
    auctionEventPublisher: AuctionEventPublisher,
  ) {
    this.closeAuctionUseCase = new CloseAuctionUseCase(
      auctionRepository,
      bidRepository,
      orderRepository,
      auctionEventPublisher,
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