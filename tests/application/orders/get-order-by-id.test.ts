import { describe, expect, it, jest } from "@jest/globals";
import { GetOrderByIdUseCase } from "../../../src/application/use-cases/orders/get-order-by-id/get-order-by-id";
import { Auction } from "../../../src/domain/entities/auction";
import { Order } from "../../../src/domain/entities/order";
import { OrderRepository } from "../../../src/domain/ports/order.repository";
import { AuctionRepository } from "../../../src/domain/ports/auction.repository";

describe("GetOrderByIdUseCase", () => {
  const order: Order = {
    id: "order-1",
    auctionId: "auction-1",
    buyerId: "buyer-1",
    amount: 150,
    status: "PENDING",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
  };

  const auction: Auction = {
    id: "auction-1",
    title: "Laptop",
    description: "Used laptop",
    categoryId: "category-1",
    sellerId: "seller-1",
    basePrice: 100,
    minimumIncrement: 10,
    currentBid: 150,
    status: "CLOSED",
    closesAt: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2025-12-01T00:00:00.000Z"),
  };

  function createUseCase() {
    const orderRepository = {
      findById: jest.fn<OrderRepository["findById"]>(),
      update: jest.fn<OrderRepository["update"]>(),
    };
    const auctionRepository = {
      findById: jest.fn<AuctionRepository["findById"]>(),
    };

    const useCase = new GetOrderByIdUseCase(
      orderRepository as unknown as OrderRepository,
      auctionRepository as unknown as AuctionRepository,
    );

    return { useCase, orderRepository, auctionRepository };
  }

  it("returns null when the order does not exist", async () => {
    const { useCase, orderRepository, auctionRepository } = createUseCase();
    orderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("missing-order", "buyer-1"),
    ).resolves.toBeNull();
    expect(auctionRepository.findById).not.toHaveBeenCalled();
  });

  it("allows the buyer to view their order without looking up the auction", async () => {
    const { useCase, orderRepository, auctionRepository } = createUseCase();
    orderRepository.findById.mockResolvedValue(order);

    await expect(useCase.execute(order.id, order.buyerId)).resolves.toEqual(
      order,
    );
    expect(auctionRepository.findById).not.toHaveBeenCalled();
  });

  it("returns null when a non-buyer is neither the seller nor authorized", async () => {
    const { useCase, orderRepository, auctionRepository } = createUseCase();
    orderRepository.findById.mockResolvedValue(order);
    auctionRepository.findById.mockResolvedValue({
      ...auction,
      sellerId: "another-user",
    });

    await expect(useCase.execute(order.id, "stranger")).resolves.toBeNull();
    expect(auctionRepository.findById).toHaveBeenCalledWith(order.auctionId);
  });

  it("returns null when the auction for a non-buyer cannot be found", async () => {
    const { useCase, orderRepository, auctionRepository } = createUseCase();
    orderRepository.findById.mockResolvedValue(order);
    auctionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(order.id, "stranger")).resolves.toBeNull();
  });

  it("allows the seller to view the order", async () => {
    const { useCase, orderRepository, auctionRepository } = createUseCase();
    orderRepository.findById.mockResolvedValue(order);
    auctionRepository.findById.mockResolvedValue(auction);

    await expect(useCase.execute(order.id, auction.sellerId)).resolves.toEqual(
      order,
    );
  });

  it("expires an order when it has passed its expiration time", async () => {
    const { useCase, orderRepository } = createUseCase();
    const expiredOrder: Order = {
      ...order,
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    };

    orderRepository.findById.mockResolvedValue(expiredOrder);
    orderRepository.update.mockImplementation(
      async (updatedOrder) => updatedOrder,
    );

    await expect(useCase.execute(order.id, order.buyerId)).resolves.toEqual({
      ...expiredOrder,
      status: "EXPIRED",
    });
    expect(orderRepository.update).toHaveBeenCalledWith({
      ...expiredOrder,
      status: "EXPIRED",
    });
  });
});
