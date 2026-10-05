import { Auction } from "../../../../domain/entities/auction";
import { AuctionRepository } from "../../../../domain/ports/auction.repository";
import { canCancelAuction } from "../../../../domain/rules/auction.rules";

export class CancelAuctionUseCase {
  constructor(private readonly auctionRepository: AuctionRepository) {}

  async execute(id: string, sellerId: string): Promise<Auction | null> {
    const auction = await this.auctionRepository.findById(id);

    if (!auction) {
      return null;
    }

    if (auction.sellerId !== sellerId) {
      throw new Error("AUCTION_NOT_OWNER");
    }

    if (!canCancelAuction(auction)) {
      throw new Error("AUCTION_HAS_BIDS");
    }

    return this.auctionRepository.updateStatus(
      auction.id,
      "CANCELLED",
    );
  }
}