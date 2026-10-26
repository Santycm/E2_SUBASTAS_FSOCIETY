import { describe, expect, it, jest } from "@jest/globals";
import { GetProfileUseCase } from "../../../src/application/use-cases/users/get-profile/get-profile";
import { User } from "../../../src/domain/entities/user";
import { Auction } from "../../../src/domain/entities/auction";
import { Bid } from "../../../src/domain/entities/bid";
import { UserRepository } from "../../../src/domain/ports/user.repository";
import { AuctionRepository } from "../../../src/domain/ports/auction.repository";
import { BidRepository } from "../../../src/domain/ports/bid.repository";

describe("GetProfileUseCase", () => {
  const user: User = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    password: "hashed-password",
  };

  function createUseCase() {
    const userRepository = {
      findById: jest.fn<UserRepository["findById"]>(),
    };
    const auctionRepository = {
      findBySellerId: jest.fn<AuctionRepository["findBySellerId"]>(),
      findById: jest.fn<AuctionRepository["findById"]>(),
    };
    const bidRepository = {
      findByBidderId: jest.fn<BidRepository["findByBidderId"]>(),
    };

    const useCase = new GetProfileUseCase(
      userRepository as unknown as UserRepository,
      auctionRepository as unknown as AuctionRepository,
      bidRepository as unknown as BidRepository,
    );

    return { useCase, userRepository, auctionRepository, bidRepository };
  }

  const auction = (id: string, title = "Laptop"): Auction => ({
    id,
    title,
    description: "Used laptop",
    categoryId: "category-1",
    sellerId: user.id,
    basePrice: 100,
    minimumIncrement: 10,
    currentBid: null,
    status: "OPEN",
    closesAt: new Date("2099-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  });

  it("returns null when the user does not exist", async () => {
    const { useCase, userRepository, auctionRepository, bidRepository } =
      createUseCase();

    userRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute("missing-user");

    expect(result).toBeNull();
    expect(userRepository.findById).toHaveBeenCalledWith("missing-user");
    expect(auctionRepository.findBySellerId).not.toHaveBeenCalled();
    expect(bidRepository.findByBidderId).not.toHaveBeenCalled();
  });

  it("returns the profile when the user has no bids", async () => {
    const { useCase, userRepository, auctionRepository, bidRepository } =
      createUseCase();

    const publishedAuctions = [auction("auction-1")];

    userRepository.findById.mockResolvedValue(user);
    auctionRepository.findBySellerId.mockResolvedValue(publishedAuctions);
    bidRepository.findByBidderId.mockResolvedValue([]);

    const result = await useCase.execute(user.id);

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      publishedAuctions,
      participatedAuctions: [],
    });
    expect(auctionRepository.findBySellerId).toHaveBeenCalledWith(user.id);
    expect(bidRepository.findByBidderId).toHaveBeenCalledWith(user.id);
    expect(auctionRepository.findById).not.toHaveBeenCalled();
  });

  it("returns unique participated auctions and ignores auctions that no longer exist", async () => {
    const { useCase, userRepository, auctionRepository, bidRepository } =
      createUseCase();

    const publishedAuctions = [auction("auction-published")];
    const participatedAuction = auction("auction-1", "Auction 1");

    const bids: Bid[] = [
      {
        id: "bid-1",
        auctionId: "auction-1",
        bidderId: user.id,
        amount: 100,
        status: "ACCEPTED",
        rejectionReason: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "bid-2",
        auctionId: "auction-1",
        bidderId: user.id,
        amount: 120,
        status: "ACCEPTED",
        rejectionReason: null,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        id: "bid-3",
        auctionId: "auction-missing",
        bidderId: user.id,
        amount: 130,
        status: "ACCEPTED",
        rejectionReason: null,
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      },
      {
        id: "bid-4",
        auctionId: "auction-2",
        bidderId: user.id,
        amount: 140,
        status: "ACCEPTED",
        rejectionReason: null,
        createdAt: new Date("2026-01-04T00:00:00.000Z"),
      },
    ];

    userRepository.findById.mockResolvedValue(user);
    auctionRepository.findBySellerId.mockResolvedValue(publishedAuctions);
    bidRepository.findByBidderId.mockResolvedValue(bids);

    auctionRepository.findById.mockImplementation(async (id) => {
      if (id === "auction-1") return participatedAuction;
      if (id === "auction-2") return auction("auction-2");
      return null;
    });

    const result = await useCase.execute(user.id);

    expect(auctionRepository.findById).toHaveBeenCalledTimes(3);
    expect(auctionRepository.findById).toHaveBeenNthCalledWith(1, "auction-1");
    expect(auctionRepository.findById).toHaveBeenNthCalledWith(
      2,
      "auction-missing",
    );
    expect(auctionRepository.findById).toHaveBeenNthCalledWith(3, "auction-2");

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      publishedAuctions,
      participatedAuctions: [participatedAuction, auction("auction-2")],
    });
  });
});
