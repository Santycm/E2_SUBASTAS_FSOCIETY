
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { HandlePaymentWebhookUseCase } from '../../../src/application/use-cases/payments/handle-payment-webhook/handle-payment-webhook';
import { Payment } from '../../../src/domain/entities/payment';
import { PaymentRepository } from '../../../src/domain/ports/payment.repository';
import { PaymentProvider } from '../../../src/domain/ports/payment.provider';
import { PaymentSettlementRepository } from '../../../src/domain/ports/payment-settlement.repository';

describe('HandlePaymentWebhookUseCase', () => {
  const now = new Date('2026-10-21T12:00:00.000Z');

  const payment: Payment = {
    id: 'payment-001',
    orderId: 'order-001',
    amount: 150000,
    status: 'PENDING',
    provider: 'MERCADOPAGO',
    externalOrderId: 'external-order-001',
    externalPaymentId: null,
    externalEventId: null,
    createdAt: new Date('2026-10-20T12:00:00.000Z'),
    updatedAt: new Date('2026-10-20T12:00:00.000Z'),
  };

  const input = {
    externalOrderId: payment.externalOrderId,
    eventId: 'event-001',
  };

  const externalPayment = {
    id: 'external-payment-001',
    externalOrderId: payment.externalOrderId,
    status: 'processed',
    amount: payment.amount,
    orderId: payment.orderId,
  };

  let paymentRepository: {
    findByExternalOrderId: jest.Mock<
      PaymentRepository['findByExternalOrderId']
    >;
  };

  let paymentSettlementRepository: {
    settle: jest.Mock<PaymentSettlementRepository['settle']>;
  };

  let paymentProvider: {
    getPayment: jest.Mock<PaymentProvider['getPayment']>;
  };

  let useCase: HandlePaymentWebhookUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    paymentRepository = {
      findByExternalOrderId: jest
        .fn<PaymentRepository['findByExternalOrderId']>()
        .mockResolvedValue(payment),
    };

    paymentSettlementRepository = {
      settle: jest
        .fn<PaymentSettlementRepository['settle']>()
        .mockResolvedValue(undefined),
    };

    paymentProvider = {
      getPayment: jest
        .fn<PaymentProvider['getPayment']>()
        .mockResolvedValue(externalPayment),
    };

    useCase = new HandlePaymentWebhookUseCase(
      paymentRepository as unknown as PaymentRepository,
      paymentSettlementRepository as unknown as PaymentSettlementRepository,
      paymentProvider as unknown as PaymentProvider,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('settles a payment as APPROVED when the external status is processed', async () => {
    await useCase.execute(input);

    expect(paymentRepository.findByExternalOrderId).toHaveBeenCalledTimes(1);
    expect(paymentRepository.findByExternalOrderId).toHaveBeenCalledWith(
      input.externalOrderId,
    );

    expect(paymentProvider.getPayment).toHaveBeenCalledTimes(1);
    expect(paymentProvider.getPayment).toHaveBeenCalledWith(
      input.externalOrderId,
    );

    expect(paymentSettlementRepository.settle).toHaveBeenCalledTimes(1);
    expect(paymentSettlementRepository.settle).toHaveBeenCalledWith({
      paymentId: payment.id,
      orderId: payment.orderId,
      externalPaymentId: externalPayment.id,
      externalEventId: input.eventId,
      status: 'APPROVED',
      updatedAt: now,
    });
  });

  it.each([
    ['processed', 'APPROVED'],
    ['failed', 'REJECTED'],
    ['canceled', 'CANCELLED'],
  ] as const)(
    'maps external status %s to internal status %s',
    async (externalStatus, expectedStatus) => {
      paymentProvider.getPayment.mockResolvedValue({
        ...externalPayment,
        status: externalStatus,
      });

      await useCase.execute(input);

      expect(paymentSettlementRepository.settle).toHaveBeenCalledWith({
        paymentId: payment.id,
        orderId: payment.orderId,
        externalPaymentId: externalPayment.id,
        externalEventId: input.eventId,
        status: expectedStatus,
        updatedAt: now,
      });
    },
  );

  it('throws PAYMENT_NOT_FOUND when the payment does not exist', async () => {
    paymentRepository.findByExternalOrderId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'PAYMENT_NOT_FOUND',
      statusCode: 404,
    });

    expect(paymentProvider.getPayment).not.toHaveBeenCalled();
    expect(paymentSettlementRepository.settle).not.toHaveBeenCalled();
  });

  it.each(['APPROVED', 'REJECTED', 'CANCELLED'] as const)(
    'does not process a payment that is already %s',
    async (status) => {
      paymentRepository.findByExternalOrderId.mockResolvedValue({
        ...payment,
        status,
      });

      await useCase.execute(input);

      expect(paymentProvider.getPayment).not.toHaveBeenCalled();
      expect(paymentSettlementRepository.settle).not.toHaveBeenCalled();
    },
  );

  it('does not settle a payment when the external status is not recognized', async () => {
    paymentProvider.getPayment.mockResolvedValue({
      ...externalPayment,
      status: 'pending',
    });

    await useCase.execute(input);

    expect(paymentProvider.getPayment).toHaveBeenCalledWith(
      input.externalOrderId,
    );
    expect(paymentSettlementRepository.settle).not.toHaveBeenCalled();
  });

  it('throws PAYMENT_EXTERNAL_REFERENCE_MISMATCH when the external order ID differs', async () => {
    paymentProvider.getPayment.mockResolvedValue({
      ...externalPayment,
      externalOrderId: 'another-external-order',
    });

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'PAYMENT_EXTERNAL_REFERENCE_MISMATCH',
      statusCode: 400,
    });

    expect(paymentSettlementRepository.settle).not.toHaveBeenCalled();
  });

  it('throws PAYMENT_EXTERNAL_REFERENCE_MISMATCH when the order ID differs', async () => {
    paymentProvider.getPayment.mockResolvedValue({
      ...externalPayment,
      orderId: 'another-order',
    });

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'PAYMENT_EXTERNAL_REFERENCE_MISMATCH',
      statusCode: 400,
    });

    expect(paymentSettlementRepository.settle).not.toHaveBeenCalled();
  });

  it('throws PAYMENT_EXTERNAL_REFERENCE_MISMATCH when the external order has no order ID', async () => {
    paymentProvider.getPayment.mockResolvedValue({
      ...externalPayment,
      orderId: null,
    });

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'PAYMENT_EXTERNAL_REFERENCE_MISMATCH',
      statusCode: 400,
    });

    expect(paymentSettlementRepository.settle).not.toHaveBeenCalled();
  });

  it('throws PAYMENT_AMOUNT_MISMATCH when the external amount differs', async () => {
    paymentProvider.getPayment.mockResolvedValue({
      ...externalPayment,
      amount: payment.amount + 1,
    });

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'PAYMENT_AMOUNT_MISMATCH',
      statusCode: 400,
    });

    expect(paymentSettlementRepository.settle).not.toHaveBeenCalled();
  });

  it('propagates an error when finding the payment fails', async () => {
    paymentRepository.findByExternalOrderId.mockRejectedValue(
      new Error('Payment lookup failed'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      'Payment lookup failed',
    );

    expect(paymentProvider.getPayment).not.toHaveBeenCalled();
    expect(paymentSettlementRepository.settle).not.toHaveBeenCalled();
  });

  it('propagates an error when retrieving the external payment fails', async () => {
    paymentProvider.getPayment.mockRejectedValue(
      new Error('Payment provider failed'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      'Payment provider failed',
    );

    expect(paymentSettlementRepository.settle).not.toHaveBeenCalled();
  });

  it('propagates an error when settling the payment fails', async () => {
    paymentSettlementRepository.settle.mockRejectedValue(
      new Error('Payment settlement failed'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      'Payment settlement failed',
    );

    expect(paymentSettlementRepository.settle).toHaveBeenCalledTimes(1);
  });
});
