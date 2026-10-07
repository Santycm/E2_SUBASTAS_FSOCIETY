import { PaymentRepository } from "../../../../domain/ports/payment.repository";
import { Payment } from "../../../../domain/entities/payment";
import { payments } from "../data/payments.data";

export class MockPaymentRepository implements PaymentRepository {
  async findAll(): Promise<Payment[]> {
    return payments;
  }

  async findById(id: string): Promise<Payment | null> {
    return payments.find((payment) => payment.id === id) ?? null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return payments.find((payment) => payment.orderId === orderId) ?? null;
  }

  async save(payment: Payment): Promise<Payment> {
    payments.push(payment);

    return payment;
  }

  async update(payment: Payment): Promise<Payment> {
    const index = payments.findIndex((item) => item.id === payment.id);

    if (index === -1) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    payments[index] = payment;

    return payment;
  }

  async findByExternalEventId(
    externalEventId: string,
  ): Promise<Payment | null> {
    return (
      payments.find((payment) => payment.externalEventId === externalEventId) ??
      null
    );
  }
}
