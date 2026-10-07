export type PaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  provider: string;
  externalOrderId: string;
  externalPaymentId: string | null;
  externalEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}