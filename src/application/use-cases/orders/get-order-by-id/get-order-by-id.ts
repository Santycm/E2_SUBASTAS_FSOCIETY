import { Order } from '../../../../domain/entities/order';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { OrderRepository } from '../../../../domain/ports/order.repository';
import { ExpireOrderUseCase } from '../expire-order/expire-order';

export class GetOrderByIdUseCase {
  private readonly expireOrderUseCase: ExpireOrderUseCase;

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly auctionRepository: AuctionRepository,
  ) {
    this.expireOrderUseCase = new ExpireOrderUseCase(
      orderRepository,
    );
  }

  async execute(
    id: string,
    userId: string,
  ): Promise<Order | null> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      return null;
    }

    if (order.buyerId !== userId) {
      const auction =
        await this.auctionRepository.findById(order.auctionId);

      if (!auction || auction.sellerId !== userId) {
        return null;
      }
    }

    return this.expireOrderUseCase.execute(order);
  }
}