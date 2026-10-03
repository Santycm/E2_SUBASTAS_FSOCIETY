import { Order } from "../../../../domain/entities/order";

export const orders: Order[] = [
  {
    id: "order-001",
    auctionId: "auction-003",
    buyerId: "user-004",
    amount: 1350000,
    status: "PENDING",
    createdAt: new Date("2026-08-25T20:00:00.000Z"),
    expiresAt: new Date("2026-08-27T20:00:00.000Z"),
  },
];
