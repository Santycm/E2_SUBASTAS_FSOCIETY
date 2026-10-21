
import mongoose, { Types } from 'mongoose';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import { connectMongoDB } from '../../../src/infrastructure/persistence/mongoose/connection';
import { OrderModel } from '../../../src/infrastructure/persistence/mongoose/models/order.model';
import { PaymentModel } from '../../../src/infrastructure/persistence/mongoose/models/payment.model';
import { MongoosePaymentSettlementRepository } from '../../../src/infrastructure/persistence/mongoose/repositories/mongoose-payment-settlement.repository';
import { CreateOrderData } from '../../../src/domain/ports/order.repository';
import { CreatePaymentData } from '../../../src/domain/ports/payment.repository';
import { SettlePaymentInput } from '../../../src/domain/ports/payment-settlement.repository';
import { PaymentStatus } from '../../../src/domain/entities/payment';

const repository = new MongoosePaymentSettlementRepository();
const testDatabaseName = 'e2_subastas_test';

const createOrderData = (
  overrides: Partial<CreateOrderData> = {},
): CreateOrderData => ({
  auctionId: new Types.ObjectId().toString(),
  buyerId: new Types.ObjectId().toString(),
  amount: 250000,
  status: 'PENDING',
  createdAt: new Date('2026-10-21T10:00:00.000Z'),
  expiresAt: new Date('2026-10-23T10:00:00.000Z'),
  ...overrides,
});

const createPaymentData = (
  orderId: string,
  overrides: Partial<CreatePaymentData> = {},
): CreatePaymentData => {
  const now = new Date('2026-10-21T10:00:00.000Z');

  return {
    orderId,
    amount: 250000,
    status: 'PENDING',
    provider: 'MERCADOPAGO',
    externalOrderId: `external-order-${new Types.ObjectId().toString()}`,
    externalPaymentId: null,
    externalEventId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

describe('MongoosePaymentSettlementRepository integration', () => {
  const createdOrderIds: Types.ObjectId[] = [];
  const createdPaymentIds: Types.ObjectId[] = [];

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env.test');
    }

    const databaseName = decodeURIComponent(
      new URL(uri).pathname.replace(/^\/+/, '').split('?')[0],
    );

    if (databaseName !== testDatabaseName) {
      throw new Error(
        `Integration tests require database "${testDatabaseName}", received "${databaseName || '(empty)'}"`,
      );
    }

    await connectMongoDB();

    if (mongoose.connection.name !== testDatabaseName) {
      await mongoose.disconnect();

      throw new Error(
        `Connected to unexpected database: ${mongoose.connection.name}`,
      );
    }

    await OrderModel.init();
    await PaymentModel.init();
  });

  beforeEach(() => {
    createdOrderIds.length = 0;
    createdPaymentIds.length = 0;
  });

  afterEach(async () => {
    if (createdPaymentIds.length > 0) {
      await PaymentModel.deleteMany({
        _id: { $in: createdPaymentIds },
      });
    }

    if (createdOrderIds.length > 0) {
      await OrderModel.deleteMany({
        _id: { $in: createdOrderIds },
      });
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const createOrder = async (
    overrides: Partial<CreateOrderData> = {},
  ) => {
    const order = await OrderModel.create(createOrderData(overrides));

    createdOrderIds.push(order._id);

    return order;
  };

  const createPayment = async (
    orderId: string,
    overrides: Partial<CreatePaymentData> = {},
  ) => {
    const payment = await PaymentModel.create(
      createPaymentData(orderId, overrides),
    );

    createdPaymentIds.push(payment._id);

    return payment;
  };

  const createInput = (
    paymentId: string,
    orderId: string,
    status: Exclude<PaymentStatus, 'PENDING'> = 'APPROVED',
  ): SettlePaymentInput => ({
    paymentId,
    orderId,
    externalPaymentId: `external-payment-${new Types.ObjectId().toString()}`,
    externalEventId: `external-event-${new Types.ObjectId().toString()}`,
    status,
    updatedAt: new Date('2026-10-21T12:00:00.000Z'),
  });

  it.each([
    ['paymentId', 'invalid-payment-id'],
    ['orderId', 'invalid-order-id'],
  ] as const)(
    'rejects an invalid %s without changing MongoDB',
    async (field, invalidId) => {
      const order = await createOrder();
      const payment = await createPayment(order._id.toString());

      const input = createInput(
        payment._id.toString(),
        order._id.toString(),
      );

      const invalidInput = {
        ...input,
        [field]: invalidId,
      } as SettlePaymentInput;

      await expect(
        repository.settle(invalidInput),
      ).rejects.toMatchObject({
        code: 'INVALID_PAYMENT_OR_ORDER_ID',
        statusCode: 400,
      });

      const persistedPayment = await PaymentModel.findById(payment._id).lean();

      expect(persistedPayment?.status).toBe('PENDING');
    },
  );

  it('throws PAYMENT_NOT_FOUND when the payment does not exist', async () => {
    const order = await createOrder();
    const nonexistentPaymentId = new Types.ObjectId().toString();

    await expect(
      repository.settle(
        createInput(nonexistentPaymentId, order._id.toString()),
      ),
    ).rejects.toMatchObject({
      code: 'PAYMENT_NOT_FOUND',
      statusCode: 404,
    });

    const persistedOrder = await OrderModel.findById(order._id).lean();

    expect(persistedOrder?.status).toBe('PENDING');
  });

  it('throws PAYMENT_ORDER_MISMATCH when the payment belongs to another order', async () => {
    const paymentOrder = await createOrder();
    const otherOrder = await createOrder();
    const payment = await createPayment(paymentOrder._id.toString());

    await expect(
      repository.settle(
        createInput(
          payment._id.toString(),
          otherOrder._id.toString(),
        ),
      ),
    ).rejects.toMatchObject({
      code: 'PAYMENT_ORDER_MISMATCH',
      statusCode: 400,
    });

    const persistedPayment = await PaymentModel.findById(payment._id).lean();
    const persistedOrder = await OrderModel.findById(otherOrder._id).lean();

    expect(persistedPayment?.status).toBe('PENDING');
    expect(persistedOrder?.status).toBe('PENDING');
  });

  it.each(['REJECTED', 'CANCELLED'] as const)(
    'does not modify a payment that is already %s',
    async (status) => {
      const order = await createOrder();
      const payment = await createPayment(order._id.toString(), { status });

      await repository.settle(
        createInput(
          payment._id.toString(),
          order._id.toString(),
          'APPROVED',
        ),
      );

      const persistedPayment = await PaymentModel.findById(payment._id).lean();
      const persistedOrder = await OrderModel.findById(order._id).lean();

      expect(persistedPayment?.status).toBe(status);
      expect(persistedOrder?.status).toBe('PENDING');
    },
  );

  it('does nothing when an approved payment already belongs to a paid order', async () => {
    const order = await createOrder({ status: 'PAID' });
    const payment = await createPayment(order._id.toString(), {
      status: 'APPROVED',
      externalPaymentId: 'external-payment-already-approved',
      externalEventId: 'external-event-already-approved',
    });

    await repository.settle(
      createInput(
        payment._id.toString(),
        order._id.toString(),
      ),
    );

    const persistedPayment = await PaymentModel.findById(payment._id).lean();
    const persistedOrder = await OrderModel.findById(order._id).lean();

    expect(persistedPayment?.status).toBe('APPROVED');
    expect(persistedPayment?.externalPaymentId).toBe(
      'external-payment-already-approved',
    );
    expect(persistedPayment?.externalEventId).toBe(
      'external-event-already-approved',
    );
    expect(persistedOrder?.status).toBe('PAID');
  });

  it.each([
    ['PENDING', 'an unpaid order'],
    [null, 'a nonexistent order'],
  ] as const)(
    'throws PAYMENT_ORDER_STATE_INCONSISTENT for an approved payment with %s',
    async (orderStatus, _description) => {
      let orderId: string;

      if (orderStatus === null) {
        orderId = new Types.ObjectId().toString();
      } else {
        const order = await createOrder({
          status: orderStatus,
        });

        orderId = order._id.toString();
      }

      const payment = await createPayment(orderId, {
        status: 'APPROVED',
      });

      await expect(
        repository.settle(
          createInput(payment._id.toString(), orderId),
        ),
      ).rejects.toMatchObject({
        code: 'PAYMENT_ORDER_STATE_INCONSISTENT',
        statusCode: 409,
      });

      const persistedPayment = await PaymentModel.findById(payment._id).lean();

      expect(persistedPayment?.status).toBe('APPROVED');
    },
  );

  it.each(['APPROVED', 'REJECTED', 'CANCELLED'] as const)(
    'persists the payment status %s',
    async (status) => {
      const order = await createOrder();
      const payment = await createPayment(order._id.toString());
      const input = createInput(
        payment._id.toString(),
        order._id.toString(),
        status,
      );

      await repository.settle(input);

      const persistedPayment = await PaymentModel.findById(payment._id).lean();

      expect(persistedPayment?.status).toBe(status);
      expect(persistedPayment?.externalPaymentId).toBe(
        input.externalPaymentId,
      );
      expect(persistedPayment?.externalEventId).toBe(input.externalEventId);
      expect(persistedPayment?.updatedAt.getTime()).toBe(
        input.updatedAt.getTime(),
      );
    },
  );

  it.each(['REJECTED', 'CANCELLED'] as const)(
    'does not change the order when the payment is %s',
    async (status) => {
      const order = await createOrder();
      const payment = await createPayment(order._id.toString());

      await repository.settle(
        createInput(
          payment._id.toString(),
          order._id.toString(),
          status,
        ),
      );

      const persistedOrder = await OrderModel.findById(order._id).lean();

      expect(persistedOrder?.status).toBe('PENDING');
    },
  );

  it('marks the order as PAID when the payment is approved', async () => {
    const order = await createOrder();
    const payment = await createPayment(order._id.toString());

    await repository.settle(
      createInput(
        payment._id.toString(),
        order._id.toString(),
        'APPROVED',
      ),
    );

    const persistedPayment = await PaymentModel.findById(payment._id).lean();
    const persistedOrder = await OrderModel.findById(order._id).lean();

    expect(persistedPayment?.status).toBe('APPROVED');
    expect(persistedOrder?.status).toBe('PAID');
  });

  it('accepts an order already PAID when approving a pending payment', async () => {
    const order = await createOrder({ status: 'PAID' });
    const payment = await createPayment(order._id.toString());

    await expect(
      repository.settle(
        createInput(
          payment._id.toString(),
          order._id.toString(),
          'APPROVED',
        ),
      ),
    ).resolves.toBeUndefined();

    const persistedPayment = await PaymentModel.findById(payment._id).lean();
    const persistedOrder = await OrderModel.findById(order._id).lean();

    expect(persistedPayment?.status).toBe('APPROVED');
    expect(persistedOrder?.status).toBe('PAID');
  });

  it('rolls back the payment update when the order cannot be marked as paid', async () => {
    const order = await createOrder({ status: 'EXPIRED' });
    const payment = await createPayment(order._id.toString());

    await expect(
      repository.settle(
        createInput(
          payment._id.toString(),
          order._id.toString(),
          'APPROVED',
        ),
      ),
    ).rejects.toMatchObject({
      code: 'ORDER_CANNOT_BE_MARKED_AS_PAID',
      statusCode: 409,
    });

    const persistedPayment = await PaymentModel.findById(payment._id).lean();
    const persistedOrder = await OrderModel.findById(order._id).lean();

    expect(persistedPayment?.status).toBe('PENDING');
    expect(persistedPayment?.externalPaymentId).toBeNull();
    expect(persistedPayment?.externalEventId).toBeNull();
    expect(persistedOrder?.status).toBe('EXPIRED');
  });
});
