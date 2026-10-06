import { Order } from "../../../../domain/entities/order";
import { OrderRepository } from "../../../../domain/ports/order.repository";
import { GetOrdersDto } from "./dto/get-orders.dto";

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
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(dto: GetOrdersDto): Promise<GetOrdersResult> {
    const result = await this.orderRepository.findByBuyerId(dto.buyerId, {
      page: dto.page,
      limit: dto.limit,
      status: dto.status,
    });

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
