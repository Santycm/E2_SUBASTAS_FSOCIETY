import mongoose, { Types } from 'mongoose';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import { connectMongoDB } from '../../../src/infrastructure/persistence/mongoose/connection';
import { OrderModel } from '../../../src/infrastructure/persistence/mongoose/models/order.model';
import { MongooseOrderRepository } from '../../../src/infrastructure/persistence/mongoose/repositories/mongoose-order.repository';
import { CreateOrderData } from '../../../src/domain/ports/order.repository';

const orderRepository = new MongooseOrderRepository();
const testDatabaseName = 'e2_subastas_test';

const createOrderData = (
  overrides: Partial<CreateOrderData> = {},
): CreateOrderData => ({
  auctionId: new Types.ObjectId().toString(),
  buyerId: new Types.ObjectId().toString(),
  amount: 250000,
  status: 'PENDING',
  createdAt: new Date('2026-10-01T10:00:00.000Z'),
  expiresAt: new Date('2026-10-03T10:00:00.000Z'),
  ...overrides,
});

describe('MongooseOrderRepository integration', () => {
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
        `Integration tests require database "${testDatabaseName}", received "${databaseName || '(empty)'}`,
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
  });

  beforeEach(async () => {
    await OrderModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('saves an order and maps MongoDB fields to the domain entity', async () => {
    const data = createOrderData();
    const order = await orderRepository.save(data);

    expect(order).toMatchObject({
      auctionId: data.auctionId,
      buyerId: data.buyerId,
      amount: data.amount,
      status: data.status,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    });

    expect(Types.ObjectId.isValid(order.id)).toBe(true);
  });

  it('finds an order by ID', async () => {
    const saved = await orderRepository.save(createOrderData());

    const found = await orderRepository.findById(saved.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
    expect(found?.amount).toBe(saved.amount);
  });

  it('returns null for invalid or nonexistent order IDs', async () => {
    await expect(
      orderRepository.findById('invalid-id'),
    ).resolves.toBeNull();

    await expect(
      orderRepository.findById(new Types.ObjectId().toString()),
    ).resolves.toBeNull();
  });

  it('finds an order by auction ID', async () => {
    const auctionId = new Types.ObjectId().toString();

    const saved = await orderRepository.save(
      createOrderData({ auctionId }),
    );

    const found = await orderRepository.findByAuctionId(auctionId);

    expect(found?.id).toBe(saved.id);
    expect(found?.auctionId).toBe(auctionId);
  });

  it('returns null for invalid or nonexistent auction IDs', async () => {
    await expect(
      orderRepository.findByAuctionId('invalid-id'),
    ).resolves.toBeNull();

    await expect(
      orderRepository.findByAuctionId(new Types.ObjectId().toString()),
    ).resolves.toBeNull();
  });

  it('finds a buyer’s orders ordered by creation date descending', async () => {
    const buyerId = new Types.ObjectId().toString();

    const older = await orderRepository.save(
      createOrderData({
        buyerId,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
      }),
    );

    const newer = await orderRepository.save(
      createOrderData({
        buyerId,
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
      }),
    );

    await orderRepository.save(createOrderData());

    const result = await orderRepository.findByBuyerId(buyerId, {
      page: 1,
      limit: 10,
    });

    expect(result.total).toBe(2);
    expect(result.data.map((order) => order.id)).toEqual([
      newer.id,
      older.id,
    ]);

    await expect(
      orderRepository.findByBuyerId('invalid-id', {
        page: 1,
        limit: 10,
      }),
    ).resolves.toEqual({
      data: [],
      total: 0,
    });
  });

  it('filters a buyer’s orders by status and paginates', async () => {
    const buyerId = new Types.ObjectId().toString();

    await orderRepository.save(
      createOrderData({
        buyerId,
        status: 'PENDING',
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
      }),
    );

    await orderRepository.save(
      createOrderData({
        buyerId,
        status: 'PENDING',
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
      }),
    );

    await orderRepository.save(
      createOrderData({
        buyerId,
        status: 'PENDING',
        createdAt: new Date('2026-10-03T10:00:00.000Z'),
      }),
    );

    await orderRepository.save(
      createOrderData({
        buyerId,
        status: 'PAID',
      }),
    );

    const result = await orderRepository.findByBuyerId(buyerId, {
      status: 'PENDING',
      page: 1,
      limit: 2,
    });

    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(2);
    expect(result.data.every((order) => order.status === 'PENDING')).toBe(
      true,
    );

    const secondPage = await orderRepository.findByBuyerId(buyerId, {
      status: 'PENDING',
      page: 2,
      limit: 2,
    });

    expect(secondPage.total).toBe(3);
    expect(secondPage.data).toHaveLength(1);
  });

  it('finds orders by multiple auction IDs', async () => {
    const auctionId1 = new Types.ObjectId().toString();
    const auctionId2 = new Types.ObjectId().toString();

    const order1 = await orderRepository.save(
      createOrderData({ auctionId: auctionId1 }),
    );

    const order2 = await orderRepository.save(
      createOrderData({ auctionId: auctionId2 }),
    );

    await orderRepository.save(createOrderData());

    const result = await orderRepository.findByAuctionIds(
      [auctionId1, auctionId2],
      { page: 1, limit: 10 },
    );

    expect(result.total).toBe(2);
    expect(result.data.map((order) => order.id).sort()).toEqual(
      [order1.id, order2.id].sort(),
    );
  });

  it('filters orders by auction IDs and status', async () => {
    const auctionId1 = new Types.ObjectId().toString();
    const auctionId2 = new Types.ObjectId().toString();

    await orderRepository.save(
      createOrderData({
        auctionId: auctionId1,
        status: 'PENDING',
      }),
    );

    await orderRepository.save(
      createOrderData({
        auctionId: auctionId2,
        status: 'PAID',
      }),
    );

    const result = await orderRepository.findByAuctionIds(
      [auctionId1, auctionId2],
      {
        status: 'PAID',
        page: 1,
        limit: 10,
      },
    );

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('PAID');
    expect(result.data[0].auctionId).toBe(auctionId2);
  });

  it('returns no orders for empty or entirely invalid auction ID lists', async () => {
    await orderRepository.save(createOrderData());

    await expect(
      orderRepository.findByAuctionIds([], {
        page: 1,
        limit: 10,
      }),
    ).resolves.toEqual({
      data: [],
      total: 0,
    });

    await expect(
      orderRepository.findByAuctionIds(['invalid-id'], {
        page: 1,
        limit: 10,
      }),
    ).resolves.toEqual({
      data: [],
      total: 0,
    });
  });

  it('updates an order and persists the new status', async () => {
    const saved = await orderRepository.save(createOrderData());

    const updated = await orderRepository.update({
      ...saved,
      status: 'PAID',
    });

    expect(updated.id).toBe(saved.id);
    expect(updated.status).toBe('PAID');

    const found = await orderRepository.findById(saved.id);

    expect(found?.status).toBe('PAID');
  });

  it('throws when updating an invalid or nonexistent order ID', async () => {
    const saved = await orderRepository.save(createOrderData());

    await expect(
      orderRepository.update({
        ...saved,
        id: 'invalid-id',
      }),
    ).rejects.toThrow('INVALID_ORDER_ID');

    await expect(
      orderRepository.update({
        ...saved,
        id: new Types.ObjectId().toString(),
      }),
    ).rejects.toThrow('ORDER_NOT_FOUND');
  });

  it('prevents creating two orders for the same auction', async () => {
    const auctionId = new Types.ObjectId().toString();

    await orderRepository.save(createOrderData({ auctionId }));

    await expect(
      orderRepository.save(createOrderData({ auctionId })),
    ).rejects.toMatchObject({
      code: 11000,
    });
  });
});