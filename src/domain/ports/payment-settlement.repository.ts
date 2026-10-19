import { PaymentStatus } from '../entities/payment';

export interface SettlePaymentInput {
  paymentId: string;
  orderId: string;
  externalPaymentId: string;
  externalEventId: string;
  status: Exclude<PaymentStatus, 'PENDING'>;
  updatedAt: Date;
}

export interface PaymentSettlementRepository {
  settle(input: SettlePaymentInput): Promise<void>;
}