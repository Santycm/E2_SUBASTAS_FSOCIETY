import mongoose, { Types } from 'mongoose';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import { CreatePaymentData } from '../../../src/domain/ports/payment.repository';
import { connectMongoDB } from '../../../src/infrastructure/persistence/mongoose/connection';
import { PaymentModel } from '../../../src/infrastructure/persistence/mongoose/models/payment.model';
import { MongoosePaymentRepository } from '../../../src/infrastructure/persistence/mongoose/repositories/mongoose-payment.repository';

const paymentRepository = new MongoosePaymentRepository();
const testDatabaseName = 'e2_subastas_test';

const createPaymentData = (
  overrides: Partial<CreatePaymentData> = {},
): CreatePaymentData => ({
  orderId: new Types.ObjectId().toString(),
  amount: 150000,
  status: 'PENDING',
  provider: 'MERCADOPAGO',
  externalOrderId: `external-order-${new Types.ObjectId().toString()}`,
  externalPaymentId: null,
  externalEventId: null,
  createdAt: new Date('2026-10-01T10:00:00.000Z'),
  updatedAt: new Date('2026-10-01T10:00:00.000Z'),
  ...overrides,
});

describe('MongoosePaymentRepository integration', () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env.test');
    }

    const databaseName = decodeURIComponent(
      new URL(uri).pathname.replace(/^\//, ''),
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
  });

  beforeEach(async () => {
    await PaymentModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('saves a payment and maps MongoDB fields to the domain entity', async () => {
    const data = createPaymentData();

    const payment = await paymentRepository.save(data);

    expect(payment).toMatchObject({
      orderId: data.orderId,
      amount: data.amount,
      status: data.status,
      provider: data.provider,
      externalOrderId: data.externalOrderId,
      externalPaymentId: data.externalPaymentId,
      externalEventId: data.externalEventId,
    });

    expect(Types.ObjectId.isValid(payment.id)).toBe(true);
    expect(payment.createdAt).toBeInstanceOf(Date);
    expect(payment.updatedAt).toBeInstanceOf(Date);
  });

  it('finds a payment by ID', async () => {
    const saved = await paymentRepository.save(createPaymentData());

    const found = await paymentRepository.findById(saved.id);

    expect(found).not.toBeNull();
    expect(found).toEqual(saved);
  });

  it('returns null for invalid or nonexistent payment IDs', async () => {
    await expect(
      paymentRepository.findById('invalid-id'),
    ).resolves.toBeNull();

    await expect(
      paymentRepository.findById(new Types.ObjectId().toString()),
    ).resolves.toBeNull();
  });

  it('finds a payment by order ID', async () => {
    const data = createPaymentData();
    const saved = await paymentRepository.save(data);

    const found = await paymentRepository.findByOrderId(data.orderId);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
    expect(found?.orderId).toBe(data.orderId);
  });

  it('returns null for invalid or nonexistent order IDs', async () => {
    await expect(
      paymentRepository.findByOrderId('invalid-id'),
    ).resolves.toBeNull();

    await expect(
      paymentRepository.findByOrderId(
        new Types.ObjectId().toString(),
      ),
    ).resolves.toBeNull();
  });

  it('finds a payment by external order ID', async () => {
    const data = createPaymentData();
    const saved = await paymentRepository.save(data);

    const found = await paymentRepository.findByExternalOrderId(
      data.externalOrderId,
    );

    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
    expect(found?.externalOrderId).toBe(data.externalOrderId);
  });

  it('returns null when the external order ID does not exist', async () => {
    await expect(
      paymentRepository.findByExternalOrderId('external-order-missing'),
    ).resolves.toBeNull();
  });

  it('finds a payment by external event ID', async () => {
    const eventId = `event-${new Types.ObjectId().toString()}`;
    const data = createPaymentData({ externalEventId: eventId });

    const saved = await paymentRepository.save(data);
    const found = await paymentRepository.findByExternalEventId(eventId);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
    expect(found?.externalEventId).toBe(eventId);
  });

  it('returns null when the external event ID does not exist', async () => {
    await expect(
      paymentRepository.findByExternalEventId('event-missing'),
    ).resolves.toBeNull();
  });

  it('updates a payment and returns the persisted values', async () => {
    const saved = await paymentRepository.save(createPaymentData());

    const updated = await paymentRepository.update({
      ...saved,
      status: 'APPROVED',
      externalPaymentId: `payment-${new Types.ObjectId().toString()}`,
      externalEventId: `event-${new Types.ObjectId().toString()}`,
      updatedAt: new Date('2026-10-02T10:00:00.000Z'),
    });

    expect(updated.id).toBe(saved.id);
    expect(updated.status).toBe('APPROVED');
    expect(updated.externalPaymentId).not.toBeNull();
    expect(updated.externalEventId).not.toBeNull();

    const found = await paymentRepository.findById(saved.id);

    expect(found).toEqual(updated);
  });

  it('rejects an update with an invalid payment ID', async () => {
    await expect(
      paymentRepository.update({
        ...createPaymentData(),
        id: 'invalid-id',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_PAYMENT_ID',
      statusCode: 400,
    });
  });

  it('rejects an update when the payment does not exist', async () => {
    const nonexistentPayment = {
      ...createPaymentData(),
      id: new Types.ObjectId().toString(),
    };

    await expect(
      paymentRepository.update(nonexistentPayment),
    ).rejects.toMatchObject({
      code: 'PAYMENT_NOT_FOUND',
      statusCode: 404,
    });
  });
});
