import { Bid } from '../../../../domain/entities/bid';

export const bidsData: Bid[] = [
  {
    id: 'bid-001',
    auctionId: 'auction-001',
    bidderId: 'user-002',
    amount: 5100000,
    status: 'ACCEPTED',
    rejectionReason: null,
    createdAt: new Date('2026-08-30T15:30:00.000Z'),
  },
  {
    id: 'bid-002',
    auctionId: 'auction-001',
    bidderId: 'user-003',
    amount: 5500000,
    status: 'ACCEPTED',
    rejectionReason: null,
    createdAt: new Date('2026-08-30T15:35:00.000Z'),
  },
  {
    id: 'bid-003',
    auctionId: 'auction-003',
    bidderId: 'user-001',
    amount: 1250000,
    status: 'ACCEPTED',
    rejectionReason: null,
    createdAt: new Date('2026-08-21T14:00:00.000Z'),
  },
  {
    id: 'bid-004',
    auctionId: 'auction-003',
    bidderId: 'user-004',
    amount: 1350000,
    status: 'ACCEPTED',
    rejectionReason: null,
    createdAt: new Date('2026-08-22T16:00:00.000Z'),
  },
];