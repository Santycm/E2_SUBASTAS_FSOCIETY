import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { GetAuctionsDto } from './dto/get-auctions.dto';

export interface GetAuctionsResult {
  data: Auction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetAuctionsUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
  ) {}

  async execute(dto: GetAuctionsDto): Promise<GetAuctionsResult> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const auctions = await this.auctionRepository.findAll({
      categoryId: dto.categoryId,
      status: dto.status,
    });

    const total = auctions.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const data = auctions.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}