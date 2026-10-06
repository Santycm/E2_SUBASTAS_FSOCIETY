import { Auction } from '../../../../domain/entities/auction';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { BidRepository } from '../../../../domain/ports/bid.repository';
import { GetAuctionsDto } from './dto/get-auctions.dto';
import { CloseAuctionUseCase } from '../close-auction/close-auction';
import { OrderRepository } from '../../../../domain/ports/order.repository';

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
  private readonly closeAuctionUseCase: CloseAuctionUseCase;

  constructor(
    private readonly auctionRepository: AuctionRepository,
    bidRepository: BidRepository,
    orderRepository: OrderRepository,
  ) {
    this.closeAuctionUseCase = new CloseAuctionUseCase(
      auctionRepository,
      bidRepository,
      orderRepository,
    );
  }

  async execute(dto: GetAuctionsDto): Promise<GetAuctionsResult> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const result = await this.auctionRepository.findAll({
      categoryId: dto.categoryId,
      status: dto.status,
      page,
      limit,
    });

    const data = await Promise.all(
      result.data.map((auction) =>
        this.closeAuctionUseCase.execute(auction),
      ),
    );

    const totalPages = Math.ceil(result.total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }
}