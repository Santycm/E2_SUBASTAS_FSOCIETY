import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExpireOrderUseCase } from '../../../src/application/use-cases/orders/expire-order/expire-order';
import { Order } from '../../../src/domain/entities/order';
import { OrderRepository } from '../../../src/domain/ports/order.repository';

describe('ExpireOrderUseCase', () => {
  const now = new Date('2026-11-03T12:00:00.000Z');

  const pendingOrder: Order = {
    id: 'order-001',
    auctionId: 'auction-001',
    buyerId: 'buyer-001',
    amount: 150000,
    status: 'PENDING',
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
    expiresAt: new Date('2026-11-03T12:00:00.000Z'),
  };

  let orderRepository: {
    update: jest.Mock<OrderRepository['update']>;
  };

  let useCase: ExpireOrderUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    orderRepository = {
      update: jest.fn<OrderRepository['update']>().mockImplementation(
        async (order) => order,
      ),
    };

    useCase = new ExpireOrderUseCase(
      orderRepository as unknown as OrderRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('expires a pending order when its expiration time is reached', async () => {
    const result = await useCase.execute(pendingOrder);

    expect(orderRepository.update).toHaveBeenCalledTimes(1);
    expect(orderRepository.update).toHaveBeenCalledWith({
      ...pendingOrder,
      status: 'EXPIRED',
    });
    expect(result).toEqual({
      ...pendingOrder,
      status: 'EXPIRED',
    });
  });

  it('returns a pending order without updating it when it has not expired', async () => {
    const order: Order = {
      ...pendingOrder,
      expiresAt: new Date('2026-11-03T12:00:00.001Z'),
    };

    const result = await useCase.execute(order);

    expect(result).toBe(order);
    expect(result.status).toBe('PENDING');
    expect(orderRepository.update).not.toHaveBeenCalled();
  });

  it.each(['PAID', 'EXPIRED'] as const)(
    'returns an order with status %s without updating it',
    async (status) => {
      const order: Order = {
        ...pendingOrder,
        status,
        expiresAt: new Date('2026-11-01T12:00:00.000Z'),
      };

      const result = await useCase.execute(order);

      expect(result).toBe(order);
      expect(result.status).toBe(status);
      expect(orderRepository.update).not.toHaveBeenCalled();
    },
  );

  it('propagates an error when updating the expired order fails', async () => {
    const error = new Error('Order could not be updated');

    orderRepository.update.mockRejectedValue(error);

    await expect(useCase.execute(pendingOrder)).rejects.toThrow(
      'Order could not be updated',
    );

    expect(orderRepository.update).toHaveBeenCalledTimes(1);
    expect(orderRepository.update).toHaveBeenCalledWith({
      ...pendingOrder,
      status: 'EXPIRED',
    });
  });
});