import { Payment } from '../../../../domain/entities/payment';
import { OrderRepository } from '../../../../domain/ports/order.repository';
import { PaymentRepository } from '../../../../domain/ports/payment.repository';
import { PaymentProvider } from '../../../../domain/ports/payment.provider';

export interface HandlePaymentWebhookInput {
  externalOrderId: string;
  eventId: string;
}

export class HandlePaymentWebhookUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository,
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async execute(input: HandlePaymentWebhookInput): Promise<void> {
    const payment = await this.paymentRepository.findByExternalOrderId(
      input.externalOrderId,
    );

    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.status === 'APPROVED') {
      return;
    }

    const order = await this.orderRepository.findById(payment.orderId);

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.status === 'PAID') {
      return;
    }

    const externalPayment = await this.paymentProvider.getPayment(
      input.externalOrderId,
    );

    if (externalPayment.externalOrderId !== payment.externalOrderId) {
      throw new Error('PAYMENT_ORDER_ID_MISMATCH');
    }

    if (externalPayment.orderId !== order.id) {
      throw new Error('PAYMENT_EXTERNAL_REFERENCE_MISMATCH');
    }

    if (externalPayment.amount !== order.amount) {
      throw new Error('PAYMENT_AMOUNT_MISMATCH');
    }

    const now = new Date();

    const isApproved = externalPayment.status === 'processed';
    const isRejected = externalPayment.status === 'failed';
    const isCancelled = externalPayment.status === 'canceled';

    if (!isApproved && !isRejected && !isCancelled) {
      return;
    }

    let paymentStatus: Payment['status'] = payment.status;

    if (isApproved) {
      paymentStatus = 'APPROVED';
    } else if (isRejected) {
      paymentStatus = 'REJECTED';
    } else if (isCancelled) {
      paymentStatus = 'CANCELLED';
    }

    await this.paymentRepository.update({
      ...payment,
      status: paymentStatus,
      externalPaymentId: externalPayment.id,
      externalEventId: input.eventId,
      updatedAt: now,
    });

    if (isApproved) {
      await this.orderRepository.update({
        ...order,
        status: 'PAID',
      });
    }
  }
}
