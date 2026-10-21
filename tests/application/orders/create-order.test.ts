
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CreateOrderUseCase } from '../../../src/application/use-cases/orders/create-order/create-order';
import { Order } from '../../../src/domain/entities/order';
import { OrderRepository } from '../../../src/domain/ports/order.repository';

describe('CreateOrderUseCase', () => {
  const now = new Date('2026-11-01T12:00:00.000Z');

  const dto = {
    auctionId: 'auction-001',
    buyerId: 'buyer-001',
    amount: 150000,
  };

  const existingOrder: Order = {
    id: 'order-001',
    auctionId: dto.auctionId,
    buyerId: dto.buyerId,
    amount: dto.amount,
    status: 'PENDING',
    createdAt: new Date('2026-11-01T10:00:00.000Z'),
    expiresAt: new Date('2026-11-03T10:00:00.000Z'),
  };

  let orderRepository: {
    findByAuctionId: jest.Mock<OrderRepository['findByAuctionId']>;
    save: jest.Mock<OrderRepository['save']>;
  };

  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    orderRepository = {
      findByAuctionId: jest
        .fn<OrderRepository['findByAuctionId']>()
        .mockResolvedValue(null),
      save: jest.fn<OrderRepository['save']>().mockImplementation(async (data) => ({
        id: 'order-001',
        ...data,
      })),
    };

    useCase = new CreateOrderUseCase(
      orderRepository as unknown as OrderRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an order when no order exists for the auction', async () => {
    const result = await useCase.execute(dto);

    expect(orderRepository.findByAuctionId).toHaveBeenCalledTimes(1);
    expect(orderRepository.findByAuctionId).toHaveBeenCalledWith(dto.auctionId);

    expect(orderRepository.save).toHaveBeenCalledTimes(1);
    expect(orderRepository.save).toHaveBeenCalledWith({
      auctionId: dto.auctionId,
      buyerId: dto.buyerId,
      amount: dto.amount,
      status: 'PENDING',
      createdAt: now,
      expiresAt: new Date('2026-11-03T12:00:00.000Z'),
    });

    expect(result).toEqual({
      id: 'order-001',
      auctionId: dto.auctionId,
      buyerId: dto.buyerId,
      amount: dto.amount,
      status: 'PENDING',
      createdAt: now,
      expiresAt: new Date('2026-11-03T12:00:00.000Z'),
    });
  });

  it('returns the existing order without creating another one', async () => {
    orderRepository.findByAuctionId.mockResolvedValue(existingOrder);

    const result = await useCase.execute(dto);

    expect(orderRepository.findByAuctionId).toHaveBeenCalledWith(dto.auctionId);
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(result).toBe(existingOrder);
  });

  it('preserves the existing order even when the new DTO has different buyer and amount', async () => {
    orderRepository.findByAuctionId.mockResolvedValue(existingOrder);

    const result = await useCase.execute({
      ...dto,
      buyerId: 'buyer-002',
      amount: 250000,
    });

    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(result).toBe(existingOrder);
    expect(result.buyerId).toBe(dto.buyerId);
    expect(result.amount).toBe(dto.amount);
  });

  it('does not create an order when searching for an existing order fails', async () => {
    const error = new Error('Database connection failed');

    orderRepository.findByAuctionId.mockRejectedValue(error);

    await expect(useCase.execute(dto)).rejects.toThrow(
      'Database connection failed',
    );

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('propagates an error when saving the order fails', async () => {
    orderRepository.save.mockRejectedValue(
      new Error('Order could not be saved'),
    );

    await expect(useCase.execute(dto)).rejects.toThrow(
      'Order could not be saved',
    );

    expect(orderRepository.findByAuctionId).toHaveBeenCalledWith(dto.auctionId);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
  });
});
