import { Payment } from '../entities/payment';

export interface PaymentRepository {
  findAll(): Promise<Payment[]>;

  findById(id: string): Promise<Payment | null>;

  findByOrderId(orderId: string): Promise<Payment | null>;

  save(payment: Payment): Promise<Payment>;

  update(payment: Payment): Promise<Payment>;
}