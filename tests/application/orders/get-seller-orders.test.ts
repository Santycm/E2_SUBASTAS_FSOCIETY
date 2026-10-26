import { describe, expect, it, jest } from "@jest/globals";
import { GetSellerOrdersUseCase } from "../../../src/application/use-cases/orders/get-seller-orders/get-seller-orders";
import { Auction } from "../../../src/domain/entities/auction";
import { Order } from "../../../src/domain/entities/order";
import { AuctionRepository } from "../../../src/domain/ports/auction.repository";
import { OrderRepository } from "../../../src/domain/ports/order.repository";

describe("GetSellerOrdersUseCase", () => {
  const dto = { sellerId: "seller-1", page: 1, limit: 10 };

  function createUseCase() {
    const auctionRepository = {
      findBySellerId: jest.fn<AuctionRepository["findBySellerId"]>(),
    };
    const orderRepository = {
      findByAuctionIds: jest.fn<OrderRepository["findByAuctionIds"]>(),
      update: jest.fn<OrderRepository["update"]>(),
    };

    const useCase = new GetSellerOrdersUseCase(
      auctionRepository as unknown as AuctionRepository,
      orderRepository as unknown as OrderRepository,
    );

    return { useCase, auctionRepository, orderRepository };
  }

  const auction = (id: string): Auction => ({
    id,
    title: "Laptop",
    description: "Used laptop",
    categoryId: "category-1",
    sellerId: dto.sellerId,
    basePrice: 100,
    minimumIncrement: 10,
    currentBid: null,
    status: "OPEN",
    closesAt: new Date("2099-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  });

  it("returns an empty paginated result when the seller has no auctions", async () => {
    const { useCase, auctionRepository, orderRepository } = createUseCase();
    auctionRepository.findBySellerId.mockResolvedValue([]);
    orderRepository.findByAuctionIds.mockResolvedValue({ data: [], total: 0 });

    const result = await useCase.execute(dto);

    expect(auctionRepository.findBySellerId).toHaveBeenCalledWith(dto.sellerId);
    expect(orderRepository.findByAuctionIds).toHaveBeenCalledWith([], {
      page: dto.page,
      limit: dto.limit,
      status: undefined,
    });
    expect(result).toEqual({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
  });

  it("queries orders for the seller auctions and applies the status filter", async () => {
    const { useCase, auctionRepository, orderRepository } = createUseCase();

    auctionRepository.findBySellerId.mockResolvedValue([
      auction("auction-1"),
      auction("auction-2"),
    ]);

    const orders: Order[] = [
      {
        id: "order-1",
        auctionId: "auction-1",
        buyerId: "buyer-1",
        amount: 100,
        status: "PAID",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        expiresAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ];

    orderRepository.findByAuctionIds.mockResolvedValue({
      data: orders,
      total: 11,
    });

    const result = await useCase.execute({ ...dto, status: "PAID" });

    expect(orderRepository.findByAuctionIds).toHaveBeenCalledWith(
      ["auction-1", "auction-2"],
      { page: dto.page, limit: dto.limit, status: "PAID" },
    );
    expect(result).toEqual({
      data: orders,
      pagination: { page: 1, limit: 10, total: 11, totalPages: 2 },
    });
    expect(orderRepository.update).not.toHaveBeenCalled();
  });

  it("expires pending orders in the seller order list", async () => {
    const { useCase, auctionRepository, orderRepository } = createUseCase();

    auctionRepository.findBySellerId.mockResolvedValue([auction("auction-1")]);

    const order: Order = {
      id: "order-1",
      auctionId: "auction-1",
      buyerId: "buyer-1",
      amount: 100,
      status: "PENDING",
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
      expiresAt: new Date("2020-01-02T00:00:00.000Z"),
    };

    orderRepository.findByAuctionIds.mockResolvedValue({
      data: [order],
      total: 1,
    });
    orderRepository.update.mockImplementation(
      async (updatedOrder) => updatedOrder,
    );

    const result = await useCase.execute(dto);

    expect(orderRepository.update).toHaveBeenCalledWith({
      ...order,
      status: "EXPIRED",
    });
    expect(result.data).toEqual([{ ...order, status: "EXPIRED" }]);
  });
});
