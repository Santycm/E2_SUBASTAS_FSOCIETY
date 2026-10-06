import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { BidRepository } from '../../../../domain/ports/bid.repository';
import { OrderRepository } from '../../../../domain/ports/order.repository';
import { calculateOrderExpiration } from '../../../../domain/rules/order.rules';

export class CloseAuctionUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly bidRepository: BidRepository,
    private readonly orderRepository: OrderRepository,
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

    const closedAuction =
      await this.auctionRepository.updateStatus(
        auction.id,
        'CLOSED',
      );

    const existingOrder =
      await this.orderRepository.findByAuctionId(
        auction.id,
      );

    if (!existingOrder) {
      const createdAt = new Date();

      await this.orderRepository.save({
        auctionId: auction.id,
        buyerId: highestBid.bidderId,
        amount: highestBid.amount,
        status: 'PENDING',
        createdAt,
        expiresAt: calculateOrderExpiration(createdAt),
      });
    }

    return closedAuction;
  }
}