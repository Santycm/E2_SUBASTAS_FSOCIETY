import { Auction } from "../../../../domain/entities/auction";
import { AuctionRepository } from "../../../../domain/ports/auction.repository";
import { CategoryRepository } from "../../../../domain/ports/category.repository";
import { validateAuctionCreation } from "../../../../domain/rules/auction.rules";
import { ApplicationError } from "../../../errors/application-error";
import { CreateAuctionDto } from "./dto/create-auction.dto";

export class CreateAuctionUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(dto: CreateAuctionDto): Promise<Auction> {
    const category = await this.categoryRepository.findById(dto.categoryId);

    if (!category) {
      throw new ApplicationError("CATEGORY_NOT_FOUND", 400);
    }

    const createdAt = new Date();
    const closesAt = new Date(dto.closesAt);

    const validation = validateAuctionCreation(
      dto.basePrice,
      dto.minimumIncrement,
      createdAt,
      closesAt,
    );

    if (!validation.valid) {
      throw new ApplicationError(validation.reason!, 400);
    }

    return this.auctionRepository.save({
      title: dto.title,
      description: dto.description,
      categoryId: category.id,
      sellerId: dto.sellerId,
      basePrice: dto.basePrice,
      minimumIncrement: dto.minimumIncrement,
      currentBid: null,
      status: "OPEN",
      closesAt,
      createdAt,
    });
  }
}
