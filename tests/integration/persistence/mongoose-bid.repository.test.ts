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
import { BidModel } from '../../../src/infrastructure/persistence/mongoose/models/bid.model';
import { MongooseBidRepository } from '../../../src/infrastructure/persistence/mongoose/repositories/mongoose-bid.repository';
import { CreateBidData } from '../../../src/domain/ports/bid.repository';

const bidRepository = new MongooseBidRepository();
const testDatabaseName = 'e2_subastas_test';

const createBidData = (
  overrides: Partial<CreateBidData> = {},
): CreateBidData => ({
  auctionId: new Types.ObjectId().toString(),
  bidderId: new Types.ObjectId().toString(),
  amount: 150000,
  status: 'ACCEPTED',
  rejectionReason: null,
  createdAt: new Date('2026-10-01T10:00:00.000Z'),
  ...overrides,
});

describe('MongooseBidRepository integration', () => {
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
    await BidModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('saves a bid and maps MongoDB fields to the domain entity', async () => {
    const data = createBidData({
      rejectionReason: 'INVALID_AMOUNT',
      status: 'REJECTED',
    });

    const bid = await bidRepository.save(data);

    expect(bid).toMatchObject({
      auctionId: data.auctionId,
      bidderId: data.bidderId,
      amount: data.amount,
      status: 'REJECTED',
      rejectionReason: 'INVALID_AMOUNT',
    });

    expect(Types.ObjectId.isValid(bid.id)).toBe(true);
    expect(bid.createdAt).toEqual(data.createdAt);
  });

  it('finds auction bids ordered by creation date descending', async () => {
    const auctionId = new Types.ObjectId().toString();

    const older = await bidRepository.save(
      createBidData({
        auctionId,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
      }),
    );

    const newer = await bidRepository.save(
      createBidData({
        auctionId,
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
      }),
    );

    await bidRepository.save(createBidData());

    const bids = await bidRepository.findByAuctionId(auctionId);

    expect(bids.map((bid) => bid.id)).toEqual([newer.id, older.id]);

    await expect(
      bidRepository.findByAuctionId('invalid-id'),
    ).resolves.toEqual([]);
  });

  it('finds a bidder’s bids ordered by creation date descending', async () => {
    const bidderId = new Types.ObjectId().toString();

    const older = await bidRepository.save(
      createBidData({
        bidderId,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
      }),
    );

    const newer = await bidRepository.save(
      createBidData({
        bidderId,
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
      }),
    );

    await bidRepository.save(createBidData());

    const bids = await bidRepository.findByBidderId(bidderId);

    expect(bids.map((bid) => bid.id)).toEqual([newer.id, older.id]);

    await expect(
      bidRepository.findByBidderId('invalid-id'),
    ).resolves.toEqual([]);
  });

  it('returns the highest accepted bid and ignores rejected bids', async () => {
    const auctionId = new Types.ObjectId().toString();

    await bidRepository.save(
      createBidData({
        auctionId,
        amount: 200000,
        status: 'ACCEPTED',
      }),
    );

    await bidRepository.save(
      createBidData({
        auctionId,
        amount: 500000,
        status: 'REJECTED',
        rejectionReason: 'AMOUNT_BELOW_MINIMUM',
      }),
    );

    const highest = await bidRepository.save(
      createBidData({
        auctionId,
        amount: 300000,
        status: 'ACCEPTED',
      }),
    );

    const result =
      await bidRepository.findHighestAcceptedByAuctionId(auctionId);

    expect(result?.id).toBe(highest.id);
    expect(result?.amount).toBe(300000);
    expect(result?.status).toBe('ACCEPTED');

    await expect(
      bidRepository.findHighestAcceptedByAuctionId('invalid-id'),
    ).resolves.toBeNull();
  });

  it('returns null when an auction has no accepted bids', async () => {
    const auctionId = new Types.ObjectId().toString();

    await bidRepository.save(
      createBidData({
        auctionId,
        status: 'REJECTED',
        rejectionReason: 'AUCTION_NOT_OPEN',
      }),
    );

    await expect(
      bidRepository.findHighestAcceptedByAuctionId(auctionId),
    ).resolves.toBeNull();
  });
});
