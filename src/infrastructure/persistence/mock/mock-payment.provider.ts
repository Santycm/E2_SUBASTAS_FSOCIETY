import {
  CreateExternalPaymentInput,
  CreateExternalPaymentResult,
  ExternalPayment,
  PaymentProvider,
} from '../../../domain/ports/payment.provider';

export class MockPaymentProvider
  implements PaymentProvider
{
  private payments: ExternalPayment[] = [];

  async createPayment(
    input: CreateExternalPaymentInput,
  ): Promise<CreateExternalPaymentResult> {
    const paymentId =
      `mock-payment-${this.payments.length + 1}`;

    const externalOrderId =
      `mock-order-${this.payments.length + 1}`;

    this.payments.push({
      id: paymentId,
      externalOrderId,
      status: 'pending',
      amount: input.amount,
      orderId: input.orderId,
    });

    return {
      externalOrderId,
      checkoutUrl:
        `https://mock-payment.test/${externalOrderId}`,
    };
  }

  async getPayment(
    externalOrderId: string,
  ): Promise<ExternalPayment> {
    const payment =
      this.payments.find(
        (payment) =>
          payment.externalOrderId ===
          externalOrderId,
      );

    if (!payment) {
      throw new Error(
        'EXTERNAL_PAYMENT_NOT_FOUND',
      );
    }

    return payment;
  }
}