import { describe, expect, it, jest } from "@jest/globals";
import { GetOrdersUseCase } from "../../../src/application/use-cases/orders/get-orders/get-orders";
import { Order } from "../../../src/domain/entities/order";
import { OrderRepository } from "../../../src/domain/ports/order.repository";

describe("GetOrdersUseCase", () => {
  const dto = { buyerId: "buyer-1", page: 2, limit: 2 };

  function createUseCase() {
    const orderRepository = {
      findByBuyerId: jest.fn<OrderRepository["findByBuyerId"]>(),
      update: jest.fn<OrderRepository["update"]>(),
    };

    const useCase = new GetOrdersUseCase(
      orderRepository as unknown as OrderRepository,
    );

    return { useCase, orderRepository };
  }

  it("returns orders and pagination metadata", async () => {
    const { useCase, orderRepository } = createUseCase();

    const orders: Order[] = [
      {
        id: "order-1",
        auctionId: "auction-1",
        buyerId: dto.buyerId,
        amount: 100,
        status: "PENDING",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      },
      {
        id: "order-2",
        auctionId: "auction-2",
        buyerId: dto.buyerId,
        amount: 200,
        status: "PAID",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        expiresAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ];

    orderRepository.findByBuyerId.mockResolvedValue({ data: orders, total: 5 });

    const result = await useCase.execute(dto);

    expect(orderRepository.findByBuyerId).toHaveBeenCalledWith(dto.buyerId, {
      page: dto.page,
      limit: dto.limit,
      status: undefined,
    });
    expect(result).toEqual({
      data: orders,
      pagination: { page: 2, limit: 2, total: 5, totalPages: 3 },
    });
    expect(orderRepository.update).not.toHaveBeenCalled();
  });

  it("forwards a status filter and returns an empty result", async () => {
    const { useCase, orderRepository } = createUseCase();
    orderRepository.findByBuyerId.mockResolvedValue({ data: [], total: 0 });

    const result = await useCase.execute({
      ...dto,
      status: "PAID",
    });

    expect(orderRepository.findByBuyerId).toHaveBeenCalledWith(dto.buyerId, {
      page: dto.page,
      limit: dto.limit,
      status: "PAID",
    });
    expect(result).toEqual({
      data: [],
      pagination: { page: 2, limit: 2, total: 0, totalPages: 0 },
    });
  });

  it("expires pending orders while returning the list", async () => {
    const { useCase, orderRepository } = createUseCase();

    const expiredOrder: Order = {
      id: "order-expired",
      auctionId: "auction-1",
      buyerId: dto.buyerId,
      amount: 100,
      status: "PENDING",
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
      expiresAt: new Date("2020-01-02T00:00:00.000Z"),
    };

    orderRepository.findByBuyerId.mockResolvedValue({
      data: [expiredOrder],
      total: 1,
    });
    orderRepository.update.mockImplementation(async (order) => order);

    const result = await useCase.execute(dto);

    expect(orderRepository.update).toHaveBeenCalledWith({
      ...expiredOrder,
      status: "EXPIRED",
    });
    expect(result.data).toEqual([{ ...expiredOrder, status: "EXPIRED" }]);
    expect(result.pagination.totalPages).toBe(1);
  });
});
