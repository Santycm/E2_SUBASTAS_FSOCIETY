import { Order } from '../../../../domain/entities/order';
import { OrderRepository } from '../../../../domain/ports/order.repository';

export class GetOrderByIdUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(id: string): Promise<Order | null> {
    return this.orderRepository.findById(id);
  }
}