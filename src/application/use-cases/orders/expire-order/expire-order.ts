import { Order } from '../../../../domain/entities/order';
import { OrderRepository } from '../../../../domain/ports/order.repository';
import { isOrderExpired } from '../../../../domain/rules/order.rules';

export class ExpireOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(order: Order): Promise<Order> {
    if (order.status !== 'PENDING') {
      return order;
    }

    if (!isOrderExpired(order.expiresAt)) {
      return order;
    }

    return this.orderRepository.update({
      ...order,
      status: 'EXPIRED',
    });
  }
}