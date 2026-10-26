import { describe, expect, it, jest } from "@jest/globals";
import { GetAuctionBidsUseCase } from "../../../src/application/use-cases/bids/get-auction-bids/get-auction-bids";
import { Auction } from "../../../src/domain/entities/auction";
import { Bid } from "../../../src/domain/entities/bid";
import { AuctionRepository } from "../../../src/domain/ports/auction.repository";
import { BidRepository } from "../../../src/domain/ports/bid.repository";

describe("GetAuctionBidsUseCase", () => {
  function createUseCase() {
    const auctionRepository = {
      findById: jest.fn<AuctionRepository["findById"]>(),
    };
    const bidRepository = {
      findByAuctionId: jest.fn<BidRepository["findByAuctionId"]>(),
    };

    const useCase = new GetAuctionBidsUseCase(
      auctionRepository as unknown as AuctionRepository,
      bidRepository as unknown as BidRepository,
    );

    return { useCase, auctionRepository, bidRepository };
  }

  const auction: Auction = {
    id: "auction-1",
    title: "Laptop",
    description: "Used laptop",
    categoryId: "category-1",
    sellerId: "seller-1",
    basePrice: 100,
    minimumIncrement: 10,
    currentBid: null,
    status: "OPEN",
    closesAt: new Date("2099-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  it("returns null when the auction does not exist", async () => {
    const { useCase, auctionRepository, bidRepository } = createUseCase();
    auctionRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ auctionId: "missing-auction" });

    expect(result).toBeNull();
    expect(auctionRepository.findById).toHaveBeenCalledWith("missing-auction");
    expect(bidRepository.findByAuctionId).not.toHaveBeenCalled();
  });

  it("returns the bids when the auction exists", async () => {
    const { useCase, auctionRepository, bidRepository } = createUseCase();

    const bids: Bid[] = [
      {
        id: "bid-1",
        auctionId: auction.id,
        bidderId: "buyer-1",
        amount: 100,
        status: "ACCEPTED",
        rejectionReason: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "bid-2",
        auctionId: auction.id,
        bidderId: "buyer-2",
        amount: 120,
        status: "ACCEPTED",
        rejectionReason: null,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ];

    auctionRepository.findById.mockResolvedValue(auction);
    bidRepository.findByAuctionId.mockResolvedValue(bids);

    const result = await useCase.execute({ auctionId: auction.id });

    expect(bidRepository.findByAuctionId).toHaveBeenCalledWith(auction.id);
    expect(result).toEqual({ bids });
  });

  it("returns an empty list when the auction has no bids", async () => {
    const { useCase, auctionRepository, bidRepository } = createUseCase();
    auctionRepository.findById.mockResolvedValue(auction);
    bidRepository.findByAuctionId.mockResolvedValue([]);

    await expect(useCase.execute({ auctionId: auction.id })).resolves.toEqual({
      bids: [],
    });
  });
});
