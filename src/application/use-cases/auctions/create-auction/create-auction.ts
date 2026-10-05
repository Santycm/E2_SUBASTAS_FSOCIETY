import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { validateAuctionCreation } from '../../../../domain/rules/auction.rules';
import { CreateAuctionDto } from './dto/create-auction.dto';

export class CreateAuctionUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
  ) {}

  async execute(dto: CreateAuctionDto): Promise<Auction> {
    const createdAt = new Date();
    const closesAt = new Date(dto.closesAt);

    const validation = validateAuctionCreation(
      dto.basePrice,
      dto.minimumIncrement,
      createdAt,
      closesAt,
    );

    if (!validation.valid) {
      throw new Error(validation.reason!);
    }

    return this.auctionRepository.save({
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      sellerId: dto.sellerId,
      basePrice: dto.basePrice,
      minimumIncrement: dto.minimumIncrement,
      currentBid: null,
      status: 'OPEN',
      closesAt,
      createdAt,
    });
  }
}