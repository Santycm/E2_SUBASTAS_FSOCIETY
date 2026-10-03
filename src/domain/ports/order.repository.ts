import { Order } from '../entities/order';

export interface OrderRepository {
  findAll(): Promise<Order[]>;

  findById(id: string): Promise<Order | null>;

  findByAuctionId(auctionId: string): Promise<Order | null>;

  findByBuyerId(buyerId: string): Promise<Order[]>;

  save(order: Order): Promise<Order>;

  update(order: Order): Promise<Order>;
}