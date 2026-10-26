import { describe, expect, it, jest } from "@jest/globals";
import { GetAuctionByIdUseCase } from "../../../src/application/use-cases/auctions/get-auction-by-id/get-auction-by-id";
import { Auction } from "../../../src/domain/entities/auction";
import { AuctionRepository } from "../../../src/domain/ports/auction.repository";
import { BidRepository } from "../../../src/domain/ports/bid.repository";
import { OrderRepository } from "../../../src/domain/ports/order.repository";
import { AuctionEventPublisher } from "../../../src/domain/ports/auction-event.publisher";

describe("GetAuctionByIdUseCase", () => {
  const auction: Auction = {
    id: "auction-001",
    title: "Laptop",
    description: "Laptop usada",
    categoryId: "category-001",
    sellerId: "seller-001",
    basePrice: 100000,
    minimumIncrement: 10000,
    currentBid: null,
    status: "OPEN",
    closesAt: new Date("2099-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  function createUseCase() {
    const auctionRepository = {
      findById: jest.fn<AuctionRepository["findById"]>(),
      updateStatus: jest.fn<AuctionRepository["updateStatus"]>(),
    };

    const bidRepository = {
      findHighestAcceptedByAuctionId:
        jest.fn<BidRepository["findHighestAcceptedByAuctionId"]>(),
    };

    const orderRepository = {
      findByAuctionId: jest.fn<OrderRepository["findByAuctionId"]>(),
      save: jest.fn<OrderRepository["save"]>(),
    };

    const auctionEventPublisher = {
      publishAuctionClosed:
        jest.fn<AuctionEventPublisher["publishAuctionClosed"]>(),
    };

    const useCase = new GetAuctionByIdUseCase(
      auctionRepository as unknown as AuctionRepository,
      bidRepository as unknown as BidRepository,
      orderRepository as unknown as OrderRepository,
      auctionEventPublisher as unknown as AuctionEventPublisher,
    );

    return {
      useCase,
      auctionRepository,
      bidRepository,
      orderRepository,
      auctionEventPublisher,
    };
  }

  it("returns null when the auction does not exist", async () => {
    const { useCase, auctionRepository, bidRepository } = createUseCase();

    auctionRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute("missing-auction");

    expect(result).toBeNull();
    expect(auctionRepository.findById).toHaveBeenCalledWith("missing-auction");
    expect(bidRepository.findHighestAcceptedByAuctionId).not.toHaveBeenCalled();
  });

  it("returns the auction without closing it when its closing time has not arrived", async () => {
    const {
      useCase,
      auctionRepository,
      bidRepository,
      orderRepository,
      auctionEventPublisher,
    } = createUseCase();

    auctionRepository.findById.mockResolvedValue(auction);

    const result = await useCase.execute(auction.id);

    expect(result).toEqual(auction);
    expect(auctionRepository.findById).toHaveBeenCalledWith(auction.id);
    expect(bidRepository.findHighestAcceptedByAuctionId).not.toHaveBeenCalled();
    expect(orderRepository.findByAuctionId).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(auctionEventPublisher.publishAuctionClosed).not.toHaveBeenCalled();
  });
});
