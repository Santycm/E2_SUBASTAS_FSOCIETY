import mongoose, { Types } from 'mongoose';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { connectMongoDB } from '../../../src/infrastructure/persistence/mongoose/connection';
import { AuctionModel } from '../../../src/infrastructure/persistence/mongoose/models/auction.model';
import { MongooseAuctionRepository } from '../../../src/infrastructure/persistence/mongoose/repositories/mongoose-auction.repository';
import { CreateAuctionData } from '../../../src/domain/ports/auction.repository';

const auctionRepository = new MongooseAuctionRepository();
const testDatabaseName = 'e2_subastas_test';

const createAuctionData = (
  overrides: Partial<CreateAuctionData> = {},
): CreateAuctionData => ({
  title: 'Subasta de prueba',
  description: 'Descripción de prueba',
  categoryId: new Types.ObjectId().toString(),
  sellerId: new Types.ObjectId().toString(),
  basePrice: 100000,
  minimumIncrement: 10000,
  currentBid: null,
  status: 'OPEN',
  closesAt: new Date('2027-01-01T00:00:00.000Z'),
  createdAt: new Date('2026-10-01T10:00:00.000Z'),
  ...overrides,
});

describe('MongooseAuctionRepository integration', () => {
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
  });

  beforeEach(async () => {
    await AuctionModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('saves an auction and maps MongoDB fields to the domain entity', async () => {
    const data = createAuctionData();
    const auction = await auctionRepository.save(data);

    expect(auction).toMatchObject({
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      sellerId: data.sellerId,
      basePrice: data.basePrice,
      minimumIncrement: data.minimumIncrement,
      currentBid: null,
      status: 'OPEN',
    });

    expect(Types.ObjectId.isValid(auction.id)).toBe(true);
    expect(auction.closesAt).toEqual(data.closesAt);
    expect(auction.createdAt).toEqual(data.createdAt);
  });

  it('finds an auction by ID', async () => {
    const saved = await auctionRepository.save(createAuctionData());

    const found = await auctionRepository.findById(saved.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
    expect(found?.title).toBe(saved.title);
  });

  it('returns null for invalid or nonexistent auction IDs', async () => {
    await expect(
      auctionRepository.findById('invalid-id'),
    ).resolves.toBeNull();

    await expect(
      auctionRepository.findById(new Types.ObjectId().toString()),
    ).resolves.toBeNull();
  });

  it('finds a seller’s auctions ordered by creation date descending', async () => {
    const sellerId = new Types.ObjectId().toString();

    const older = await auctionRepository.save(
      createAuctionData({
        sellerId,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
      }),
    );

    const newer = await auctionRepository.save(
      createAuctionData({
        sellerId,
        createdAt: new Date('2026-10-03T10:00:00.000Z'),
      }),
    );

    await auctionRepository.save(
      createAuctionData({
        sellerId: new Types.ObjectId().toString(),
      }),
    );

    const auctions = await auctionRepository.findBySellerId(sellerId);

    expect(auctions.map((auction) => auction.id)).toEqual([
      newer.id,
      older.id,
    ]);

    await expect(
      auctionRepository.findBySellerId('invalid-id'),
    ).resolves.toEqual([]);
  });

  it('filters auctions and paginates while returning the total count', async () => {
    const categoryId = new Types.ObjectId().toString();

    await auctionRepository.save(
      createAuctionData({
        categoryId,
        status: 'OPEN',
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
      }),
    );

    await auctionRepository.save(
      createAuctionData({
        categoryId,
        status: 'OPEN',
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
      }),
    );

    await auctionRepository.save(
      createAuctionData({
        categoryId,
        status: 'OPEN',
        createdAt: new Date('2026-10-03T10:00:00.000Z'),
      }),
    );

    await auctionRepository.save(
      createAuctionData({
        categoryId,
        status: 'CLOSED',
      }),
    );

    await auctionRepository.save(createAuctionData());

    const result = await auctionRepository.findAll({
      categoryId,
      status: 'OPEN',
      page: 1,
      limit: 2,
    });

    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].createdAt.getTime()).toBeGreaterThan(
      result.data[1].createdAt.getTime(),
    );

    const secondPage = await auctionRepository.findAll({
      categoryId,
      status: 'OPEN',
      page: 2,
      limit: 2,
    });

    expect(secondPage.total).toBe(3);
    expect(secondPage.data).toHaveLength(1);
  });

  it('updates an auction status', async () => {
    const saved = await auctionRepository.save(createAuctionData());

    const updated = await auctionRepository.updateStatus(
      saved.id,
      'CLOSED',
    );

    expect(updated.id).toBe(saved.id);
    expect(updated.status).toBe('CLOSED');

    await expect(
      auctionRepository.updateStatus('invalid-id', 'CLOSED'),
    ).rejects.toThrow('INVALID_AUCTION_ID');

    await expect(
      auctionRepository.updateStatus(
        new Types.ObjectId().toString(),
        'CLOSED',
      ),
    ).rejects.toThrow('AUCTION_NOT_FOUND');
  });

  it('updates the current bid', async () => {
    const saved = await auctionRepository.save(createAuctionData());

    const updated = await auctionRepository.updateCurrentBid(
      saved.id,
      175000,
    );

    expect(updated.id).toBe(saved.id);
    expect(updated.currentBid).toBe(175000);

    await expect(
      auctionRepository.updateCurrentBid('invalid-id', 200000),
    ).rejects.toThrow('INVALID_AUCTION_ID');

    await expect(
      auctionRepository.updateCurrentBid(
        new Types.ObjectId().toString(),
        200000,
      ),
    ).rejects.toThrow('AUCTION_NOT_FOUND');
  });
});