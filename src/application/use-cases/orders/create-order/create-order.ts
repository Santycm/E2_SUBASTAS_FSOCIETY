import { Order } from '../../../../domain/entities/order';
import { OrderRepository } from '../../../../domain/ports/order.repository';
import { calculateOrderExpiration } from '../../../../domain/rules/order.rules';

export interface CreateOrderDto {
  auctionId: string;
  buyerId: string;
  amount: number;
}

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(dto: CreateOrderDto): Promise<Order> {
    const existingOrder =
      await this.orderRepository.findByAuctionId(
        dto.auctionId,
      );

    if (existingOrder) {
      return existingOrder;
    }

    const createdAt = new Date();
    const expiresAt = calculateOrderExpiration(createdAt);

    return this.orderRepository.save({
      auctionId: dto.auctionId,
      buyerId: dto.buyerId,
      amount: dto.amount,
      status: 'PENDING',
      createdAt,
      expiresAt,
    });
  }
}