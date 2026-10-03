export type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED';

export interface Order {
  id: string;
  auctionId: string;
  buyerId: string;
  amount: number;
  status: OrderStatus;
  createdAt: Date;
  expiresAt: Date;
}