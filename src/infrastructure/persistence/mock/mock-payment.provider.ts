import { Payment } from '../../../domain/entities/payment';
import {
  CreateExternalPaymentInput,
  CreateExternalPaymentResult,
  ExternalPayment,
  PaymentProvider,
} from '../../../domain/ports/payment.provider';
import { CreatePaymentData } from '../../../domain/ports/payment.repository';

export class MockPaymentProvider implements PaymentProvider {
  private payments: ExternalPayment[] = [];

  async createPayment(
    input: CreateExternalPaymentInput,
  ): Promise<CreateExternalPaymentResult> {
    const paymentId = `mock-payment-${this.payments.length + 1}`;

    this.payments.push({
      id: paymentId,
      status: 'pending',
      amount: input.amount,
      orderId: input.orderId,
    });

    return {
      id: paymentId,
      checkoutUrl: `https://mock-payment.test/${paymentId}`,
    };
  }

  async getPayment(paymentId: string): Promise<ExternalPayment> {
    const payment = this.payments.find(
      (payment) => payment.id === paymentId,
    );

    if (!payment) {
      throw new Error('EXTERNAL_PAYMENT_NOT_FOUND');
    }

    return payment;
  }

  async save(data: CreatePaymentData): Promise<Payment> {
  const payment: Payment = {
    id: String(this.payments.length + 1),
    ...data,
  };

  this.payments.push(payment);

  return payment;
}
}