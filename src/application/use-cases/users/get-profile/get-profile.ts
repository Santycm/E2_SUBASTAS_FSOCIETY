import { BidRepository } from "../../../../domain/ports/bid.repository";
import { AuctionRepository } from "../../../../domain/ports/auction.repository";
import { UserRepository } from "../../../../domain/ports/user.repository";

export class GetProfileUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auctionRepository: AuctionRepository,
    private readonly bidRepository: BidRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    const publishedAuctions = await this.auctionRepository.findBySellerId(
      user.id,
    );

    const bids = await this.bidRepository.findByBidderId(user.id);

    const participatedAuctionIds = [
      ...new Set(bids.map((bid) => bid.auctionId)),
    ];

    const participatedAuctions = [];

    for (const auctionId of participatedAuctionIds) {
      const auction = await this.auctionRepository.findById(auctionId);

      if (auction) {
        participatedAuctions.push(auction);
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      publishedAuctions,
      participatedAuctions,
    };
  }
}
