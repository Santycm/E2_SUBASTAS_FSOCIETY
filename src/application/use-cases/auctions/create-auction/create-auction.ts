import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { CreateAuctionDto } from './dto/create-auction.dto';

export class CreateAuctionUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
  ) {}

  async execute(dto: CreateAuctionDto): Promise<Auction> {
    const auctions = await this.auctionRepository.findAll();

    const auction: Auction = {
      id: `auction-${String(auctions.length + 1).padStart(3, '0')}`,
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      sellerId: 'user-001',
      basePrice: Number(dto.basePrice),
      minimumIncrement: Number(dto.minimumIncrement),
      currentBid: null,
      status: 'OPEN',
      closesAt: new Date(dto.closesAt),
      createdAt: new Date(),
    };

    return this.auctionRepository.save(auction);
  }
}