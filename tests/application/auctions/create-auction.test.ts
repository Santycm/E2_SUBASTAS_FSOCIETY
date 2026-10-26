
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuctionRepository } from '../../../src/domain/ports/auction.repository';
import { CategoryRepository } from '../../../src/domain/ports/category.repository';
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

  let categoryRepository: {
    findById: jest.Mock<CategoryRepository['findById']>;
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

    categoryRepository = {
      findById: jest
        .fn<CategoryRepository['findById']>()
        .mockResolvedValue({
          id: dto.categoryId,
          name: 'Tecnología',
          description: 'Productos tecnológicos',
        }),
    };

    useCase = new CreateAuctionUseCase(
      auctionRepository as unknown as AuctionRepository,
      categoryRepository as unknown as CategoryRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an auction when the category exists', async () => {
    const result = await useCase.execute(dto);

    expect(categoryRepository.findById).toHaveBeenCalledWith(
      dto.categoryId,
    );

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

    expect(result).toMatchObject({
      id: 'auction-001',
      title: dto.title,
      categoryId: dto.categoryId,
      status: 'OPEN',
    });
  });

  it('rejects an auction when the category does not exist', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(dto),
    ).rejects.toMatchObject({
      message: 'CATEGORY_NOT_FOUND',
    });

    expect(auctionRepository.save).not.toHaveBeenCalled();
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
