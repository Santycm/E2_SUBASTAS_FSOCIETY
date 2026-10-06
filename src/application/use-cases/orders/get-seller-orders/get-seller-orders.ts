import { Order } from '../../../../domain/entities/order';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { OrderRepository } from '../../../../domain/ports/order.repository';

import { GetSellerOrdersDto } from './dto/get-seller-orders.dto';

export interface GetSellerOrdersResult {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetSellerOrdersUseCase {
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(
    dto: GetSellerOrdersDto,
  ): Promise<GetSellerOrdersResult> {
    const auctions =
      await this.auctionRepository.findBySellerId(dto.sellerId);

    const auctionIds = auctions.map((auction) => auction.id);

    const result =
      await this.orderRepository.findByAuctionIds(
        auctionIds,
        {
          page: dto.page,
          limit: dto.limit,
          status: dto.status,
        },
      );

    return {
      data: result.data,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / dto.limit),
      },
    };
  }
}