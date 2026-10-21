import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuctionRepository } from '../../../src/domain/ports/auction.repository';
import { CreateAuctionUseCase } from '../../../src/application/use-cases/auctions/create-auction/create-auction';

describe('CreateAuctionUseCase', () => {
  const now = new Date('2026-11-01T12:00:00.000Z');

  const dto = {
    title: 'Laptop',
    description: 'Laptop usada',
    categoryId: 'category-001',
    sellerId: 'seller-001',
    basePrice: 100000,
    minimumIncrement: 10000,
    closesAt: '2026-11-01T14:00:00.000Z',
  };

  let auctionRepository: {
    save: jest.Mock<AuctionRepository['save']>;
  };

  let useCase: CreateAuctionUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    auctionRepository = {
      save: jest
        .fn<AuctionRepository['save']>()
        .mockImplementation(async (data) => ({
          id: 'auction-001',
          ...data,
        })),
    };

    useCase = new CreateAuctionUseCase(
      auctionRepository as unknown as AuctionRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an auction with valid data', async () => {
    const result = await useCase.execute(dto);

    expect(auctionRepository.save).toHaveBeenCalledWith({
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      sellerId: dto.sellerId,
      basePrice: dto.basePrice,
      minimumIncrement: dto.minimumIncrement,
      currentBid: null,
      status: 'OPEN',
      closesAt: new Date(dto.closesAt),
      createdAt: now,
    });

    expect(result).toEqual({
      id: 'auction-001',
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      sellerId: dto.sellerId,
      basePrice: dto.basePrice,
      minimumIncrement: dto.minimumIncrement,
      currentBid: null,
      status: 'OPEN',
      closesAt: new Date(dto.closesAt),
      createdAt: now,
    });
  });

  it('rejects a base price of zero', async () => {
    await expect(
      useCase.execute({ ...dto, basePrice: 0 }),
    ).rejects.toMatchObject({
      message: 'INVALID_BASE_PRICE',
    });

    expect(auctionRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a minimum increment of zero', async () => {
    await expect(
      useCase.execute({ ...dto, minimumIncrement: 0 }),
    ).rejects.toMatchObject({
      message: 'INVALID_MINIMUM_INCREMENT',
    });

    expect(auctionRepository.save).not.toHaveBeenCalled();
  });

  it('rejects an invalid closing date', async () => {
    await expect(
      useCase.execute({ ...dto, closesAt: 'invalid-date' }),
    ).rejects.toMatchObject({
      message: 'CLOSING_DATE_BEFORE_CREATION',
    });

    expect(auctionRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a closing date that is too soon', async () => {
    await expect(
      useCase.execute({
        ...dto,
        closesAt: '2026-11-01T12:30:00.000Z',
      }),
    ).rejects.toMatchObject({
      message: 'AUCTION_TOO_SHORT',
    });

    expect(auctionRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a closing date beyond 30 days', async () => {
    await expect(
      useCase.execute({
        ...dto,
        closesAt: '2026-12-02T12:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      message: 'AUCTION_TOO_LONG',
    });

    expect(auctionRepository.save).not.toHaveBeenCalled();
  });
});