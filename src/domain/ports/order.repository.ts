import { Order } from '../entities/order';

export interface CreateOrderData {
  auctionId: string;
  buyerId: string;
  amount: number;
  status: Order['status'];
  createdAt: Date;
  expiresAt: Date;
}

export interface FindOrdersFilters {
  page: number;
  limit: number;
  status?: Order['status'];
}

export interface FindOrdersResult {
  data: Order[];
  total: number;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;

  findByAuctionId(auctionId: string): Promise<Order | null>;

  findByBuyerId(
    buyerId: string,
    filters: FindOrdersFilters,
  ): Promise<FindOrdersResult>;

  findByAuctionIds(
    auctionIds: string[],
    filters: FindOrdersFilters,
  ): Promise<FindOrdersResult>;

  save(data: CreateOrderData): Promise<Order>;

  update(order: Order): Promise<Order>;
}