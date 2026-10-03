import { Order } from '../../../../domain/entities/order';
import { OrderRepository } from '../../../../domain/ports/order.repository';

export class GetOrdersUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }
}