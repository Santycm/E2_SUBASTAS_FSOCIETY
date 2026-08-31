export interface Order {
  id: string;
  auctionId: string;
  buyerId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

export const orders: Order[] = [
  {
    id: 'order-001',
    auctionId: 'auction-003',
    buyerId: 'user-004',
    amount: 1350000,
    status: 'PENDING',
    createdAt: '2026-08-25T20:00:00.000Z',
    expiresAt: '2026-08-27T20:00:00.000Z',
  },
];