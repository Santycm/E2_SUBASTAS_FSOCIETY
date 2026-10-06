import { Order } from "../../../../domain/entities/order";
import { OrderRepository } from "../../../../domain/ports/order.repository";
import { GetOrdersDto } from "./dto/get-orders.dto";
import { ExpireOrderUseCase } from "../expire-order/expire-order";

export interface GetOrdersResult {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetOrdersUseCase {
  private readonly expireOrderUseCase: ExpireOrderUseCase;

  constructor(
    private readonly orderRepository: OrderRepository,
  ) {
    this.expireOrderUseCase = new ExpireOrderUseCase(
      orderRepository,
    );
  }

  async execute(dto: GetOrdersDto): Promise<GetOrdersResult> {
    const result = await this.orderRepository.findByBuyerId(
      dto.buyerId,
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