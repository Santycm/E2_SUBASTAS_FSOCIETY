import { Payment } from "../entities/payment";

export interface CreatePaymentData {
  orderId: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  provider: string;
  externalOrderId: string;
  externalPaymentId: string | null;
  externalEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByExternalOrderId(externalOrderId: string): Promise<Payment | null>;
  findByExternalEventId(externalEventId: string): Promise<Payment | null>;
  save(data: CreatePaymentData): Promise<Payment>;
  update(payment: Payment): Promise<Payment>;
}
