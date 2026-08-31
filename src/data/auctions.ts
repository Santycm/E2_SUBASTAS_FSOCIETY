export interface Auction {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  sellerId: string;
  basePrice: number;
  minimumIncrement: number;
  currentBid: number | null;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED' | 'NO_BIDS';
  closesAt: string;
  createdAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  createdAt: string;
}

export const auctions: Auction[] = [
  {
    id: 'auction-001',
    title: 'MacBook Pro 14',
    description: 'MacBook Pro de 14 pulgadas en excelente estado.',
    categoryId: 'cat-001',
    sellerId: 'user-001',
    basePrice: 5000000,
    minimumIncrement: 100000,
    currentBid: 5500000,
    status: 'OPEN',
    closesAt: '2026-09-15T20:00:00.000Z',
    createdAt: '2026-08-30T15:00:00.000Z',
  },
  {
    id: 'auction-002',
    title: 'Cámara Sony Alpha',
    description: 'Cámara digital Sony Alpha con lente incluido.',
    categoryId: 'cat-001',
    sellerId: 'user-002',
    basePrice: 2500000,
    minimumIncrement: 50000,
    currentBid: null,
    status: 'OPEN',
    closesAt: '2026-09-20T18:00:00.000Z',
    createdAt: '2026-08-29T12:00:00.000Z',
  },
  {
    id: 'auction-003',
    title: 'Bicicleta de montaña',
    description: 'Bicicleta de montaña en buen estado.',
    categoryId: 'cat-003',
    sellerId: 'user-003',
    basePrice: 1200000,
    minimumIncrement: 50000,
    currentBid: 1350000,
    status: 'CLOSED',
    closesAt: '2026-08-25T20:00:00.000Z',
    createdAt: '2026-08-20T10:00:00.000Z',
  },
];

export const bids: Bid[] = [
  {
    id: 'bid-001',
    auctionId: 'auction-001',
    bidderId: 'user-002',
    amount: 5100000,
    createdAt: '2026-08-30T15:30:00.000Z',
  },
  {
    id: 'bid-002',
    auctionId: 'auction-001',
    bidderId: 'user-003',
    amount: 5500000,
    createdAt: '2026-08-30T15:35:00.000Z',
  },
  {
    id: 'bid-003',
    auctionId: 'auction-003',
    bidderId: 'user-001',
    amount: 1250000,
    createdAt: '2026-08-21T14:00:00.000Z',
  },
  {
    id: 'bid-004',
    auctionId: 'auction-003',
    bidderId: 'user-004',
    amount: 1350000,
    createdAt: '2026-08-22T16:00:00.000Z',
  },
];