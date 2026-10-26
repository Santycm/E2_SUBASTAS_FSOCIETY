import { describe, expect, it } from "@jest/globals";
import { Auction } from "../../../src/domain/entities/auction";
import { validateBid } from "../../../src/domain/rules/bid.rules";

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
  closesAt: new Date("2026-12-01T12:00:00.000Z"),
  createdAt: new Date("2026-11-01T12:00:00.000Z"),
};

describe("validateBid", () => {
  it("accepts the first bid at the base price", () => {
    expect(validateBid(auction, "bidder-001", 100000, null)).toEqual({
      valid: true,
      reason: null,
    });
  });

  it("accepts the first bid above the base price", () => {
    expect(validateBid(auction, "bidder-001", 150000, null)).toEqual({
      valid: true,
      reason: null,
    });
  });

  it("rejects a first bid below the base price", () => {
    expect(validateBid(auction, "bidder-001", 99999, null)).toEqual({
      valid: false,
      reason: "AMOUNT_BELOW_MINIMUM",
    });
  });

  it("rejects a bid from the seller", () => {
    expect(validateBid(auction, auction.sellerId, 100000, null)).toEqual({
      valid: false,
      reason: "SELLER_CANNOT_BID",
    });
  });

  it("rejects a bid on a cancelled auction", () => {
    expect(
      validateBid(
        { ...auction, status: "CANCELLED" },
        "bidder-001",
        100000,
        null,
      ),
    ).toEqual({
      valid: false,
      reason: "AUCTION_CANCELLED",
    });
  });

  it("rejects a bid on a closed auction", () => {
    expect(
      validateBid({ ...auction, status: "CLOSED" }, "bidder-001", 100000, null),
    ).toEqual({
      valid: false,
      reason: "AUCTION_CLOSED",
    });
  });

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects an invalid bid amount: %s", (amount) => {
    expect(validateBid(auction, "bidder-001", amount, null)).toEqual({
      valid: false,
      reason: "INVALID_AMOUNT",
    });
  });

  it("rejects a bid when the auction is not open", () => {
    expect(
      validateBid(
        { ...auction, status: "NO_BIDS" },
        "bidder-001",
        100000,
        null,
      ),
    ).toEqual({
      valid: false,
      reason: "AUCTION_NOT_OPEN",
    });
  });

  describe("minimum increment", () => {
    const auctionWithBid: Auction = {
      ...auction,
      currentBid: 150000,
    };

    it("rejects a bid below the required increment", () => {
      expect(
        validateBid(auctionWithBid, "bidder-001", 159999, "bidder-002"),
      ).toEqual({
        valid: false,
        reason: "AMOUNT_BELOW_MINIMUM",
      });
    });

    it("accepts a bid equal to the required minimum", () => {
      expect(
        validateBid(auctionWithBid, "bidder-001", 160000, "bidder-002"),
      ).toEqual({
        valid: true,
        reason: null,
      });
    });

    it("accepts a bid above the required minimum", () => {
      expect(
        validateBid(auctionWithBid, "bidder-001", 170000, "bidder-002"),
      ).toEqual({
        valid: true,
        reason: null,
      });
    });
  });

  it("rejects the current leading bidder from outbidding themselves", () => {
    expect(
      validateBid(
        { ...auction, currentBid: 150000 },
        "bidder-001",
        160000,
        "bidder-001",
      ),
    ).toEqual({
      valid: false,
      reason: "LEADING_BIDDER_CANNOT_OUTBID_SELF",
    });
  });
});
