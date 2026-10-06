import { Order } from '../../../../domain/entities/order';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { OrderRepository } from '../../../../domain/ports/order.repository';

export class GetOrderByIdUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly auctionRepository: AuctionRepository,
  ) {}

  async execute(
    id: string,
    userId: string,
  ): Promise<Order | null> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      return null;
    }

    if (order.buyerId === userId) {
      return order;
    }

    const auction =
      await this.auctionRepository.findById(order.auctionId);

    if (!auction) {
      return null;
    }

    if (auction.sellerId !== userId) {
      return null;
    }

    return order;
  }
}