import { Order } from '../../../../domain/entities/order';
import { AuctionRepository } from '../../../../domain/ports/auction.repository';
import { OrderRepository } from '../../../../domain/ports/order.repository';

import { GetSellerOrdersDto } from './dto/get-seller-orders.dto';
import { ExpireOrderUseCase } from '../expire-order/expire-order';

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
  private readonly expireOrderUseCase: ExpireOrderUseCase;

  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly orderRepository: OrderRepository,
  ) {
    this.expireOrderUseCase = new ExpireOrderUseCase(
      orderRepository,
    );
  }

  async execute(
    dto: GetSellerOrdersDto,
  ): Promise<GetSellerOrdersResult> {
    const auctions =
      await this.auctionRepository.findBySellerId(
        dto.sellerId,
      );

    const auctionIds = auctions.map(
      (auction) => auction.id,
    );

    const result =
      await this.orderRepository.findByAuctionIds(
        auctionIds,
        {
          page: dto.page,
          limit: dto.limit,
          status: dto.status,
        },
      );

    const data = await Promise.all(
      result.data.map((order) =>
        this.expireOrderUseCase.execute(order),
      ),
    );

    return {
      data,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total: result.total,
        totalPages: Math.ceil(
          result.total / dto.limit,
        ),
      },
    };
  }
}