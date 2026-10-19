import { PaymentRepository } from '../../../../domain/ports/payment.repository';
import { PaymentProvider } from '../../../../domain/ports/payment.provider';
import { PaymentSettlementRepository } from '../../../../domain/ports/payment-settlement.repository';
import { ApplicationError } from '../../../errors/application-error';

export interface HandlePaymentWebhookInput {
  externalOrderId: string;
  eventId: string;
}

export class HandlePaymentWebhookUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentSettlementRepository: PaymentSettlementRepository,
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async execute(input: HandlePaymentWebhookInput): Promise<void> {
    const payment = await this.paymentRepository.findByExternalOrderId(
      input.externalOrderId,
    );

    if (!payment) {
      throw new ApplicationError('PAYMENT_NOT_FOUND', 404);
    }

    if (payment.status !== 'PENDING') {
      return;
    }

    const externalPayment = await this.paymentProvider.getPayment(
      input.externalOrderId,
    );

    if (externalPayment.externalOrderId !== payment.externalOrderId) {
      throw new ApplicationError('PAYMENT_EXTERNAL_REFERENCE_MISMATCH', 400);
    }

    if (externalPayment.orderId !== payment.orderId) {
      throw new ApplicationError('PAYMENT_EXTERNAL_REFERENCE_MISMATCH', 400);
    }

    if (externalPayment.amount !== payment.amount) {
      throw new ApplicationError('PAYMENT_AMOUNT_MISMATCH', 400);
    }

    let status:
      | 'APPROVED'
      | 'REJECTED'
      | 'CANCELLED'
      | null = null;

    if (externalPayment.status === 'processed') {
      status = 'APPROVED';
    } else if (externalPayment.status === 'failed') {
      status = 'REJECTED';
    } else if (externalPayment.status === 'canceled') {
      status = 'CANCELLED';
    }

    if (!status) {
      return;
    }

    await this.paymentSettlementRepository.settle({
      paymentId: payment.id,
      orderId: payment.orderId,
      externalPaymentId: externalPayment.id,
      externalEventId: input.eventId,
      status,
      updatedAt: new Date(),
    });
  }
}