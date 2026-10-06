import { Order } from '../../../../domain/entities/order';
import {
  CreateOrderData,
  FindOrdersFilters,
  FindOrdersResult,
  OrderRepository,
} from '../../../../domain/ports/order.repository';
import { orders } from '../data/orders.data';

export class MockOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    return orders.find((order) => order.id === id) ?? null;
  }

  async findByAuctionId(auctionId: string): Promise<Order | null> {
    return (
      orders.find((order) => order.auctionId === auctionId) ?? null
    );
  }

  async findByBuyerId(
    buyerId: string,
    filters: FindOrdersFilters,
  ): Promise<FindOrdersResult> {
    let result = orders.filter(
      (order) => order.buyerId === buyerId,
    );

    if (filters.status) {
      result = result.filter(
        (order) => order.status === filters.status,
      );
    }

    const total = result.length;
    const skip = (filters.page - 1) * filters.limit;

    result = result.slice(
      skip,
      skip + filters.limit,
    );

    return {
      data: result,
      total,
    };
  }

  async findByAuctionIds(
    auctionIds: string[],
    filters: FindOrdersFilters,
  ): Promise<FindOrdersResult> {
    let result = orders.filter((order) =>
      auctionIds.includes(order.auctionId),
    );

    if (filters.status) {
      result = result.filter(
        (order) => order.status === filters.status,
      );
    }

    result.sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const total = result.length;
    const skip = (filters.page - 1) * filters.limit;

    result = result.slice(
      skip,
      skip + filters.limit,
    );

    return {
      data: result,
      total,
    };
  }

  async save(data: CreateOrderData): Promise<Order> {
    const order: Order = {
      id: `order-${String(orders.length + 1).padStart(3, '0')}`,
      ...data,
    };

    orders.push(order);

    return order;
  }

  async update(order: Order): Promise<Order> {
    const index = orders.findIndex(
      (item) => item.id === order.id,
    );

    if (index === -1) {
      throw new Error('ORDER_NOT_FOUND');
    }

    orders[index] = order;

    return order;
  }
}