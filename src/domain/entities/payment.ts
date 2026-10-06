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
  externalPaymentId: string | null;
  externalEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}