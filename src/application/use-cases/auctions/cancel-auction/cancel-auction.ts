
import { Auction } from "../../../../domain/entities/auction";
import { AuctionRepository } from "../../../../domain/ports/auction.repository";
import { canCancelAuction } from "../../../../domain/rules/auction.rules";
import { ApplicationError } from "../../../errors/application-error";

export class CancelAuctionUseCase {
  constructor(private readonly auctionRepository: AuctionRepository) {}

  async execute(id: string, sellerId: string): Promise<Auction | null> {
    const auction = await this.auctionRepository.findById(id);

    if (!auction) {
      return null;
    }

    if (auction.sellerId !== sellerId) {
      throw new ApplicationError("AUCTION_NOT_OWNER", 403);
    }

    if (!canCancelAuction(auction)) {
      throw new ApplicationError("AUCTION_HAS_BIDS", 409);
    }

    return this.auctionRepository.updateStatus(
      auction.id,
      "CANCELLED",
    );
  }
}
