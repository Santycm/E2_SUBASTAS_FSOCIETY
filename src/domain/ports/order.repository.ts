import { Order } from '../entities/order';

export interface CreateOrderData {
  auctionId: string;
  buyerId: string;
  amount: number;
  status: Order['status'];
  createdAt: Date;
  expiresAt: Date;
}

export interface OrderRepository {
  findAll(): Promise<Order[]>;

  findById(id: string): Promise<Order | null>;

  findByAuctionId(auctionId: string): Promise<Order | null>;

  findByBuyerId(buyerId: string): Promise<Order[]>;

  save(data: CreateOrderData): Promise<Order>;

  update(order: Order): Promise<Order>;
}