import { OrderRepository } from '../../../../domain/ports/order.repository';
import { Order } from '../../../../domain/entities/order';
import { orders } from '../data/orders.data';

export class MockOrderRepository implements OrderRepository {
  async findAll(): Promise<Order[]> {
    return orders;
  }

  async findById(id: string): Promise<Order | null> {
    return orders.find((order) => order.id === id) ?? null;
  }

  async findByAuctionId(auctionId: string): Promise<Order | null> {
    return (
      orders.find((order) => order.auctionId === auctionId) ?? null
    );
  }

  async findByBuyerId(buyerId: string): Promise<Order[]> {
    return orders.filter((order) => order.buyerId === buyerId);
  }

  async save(order: Order): Promise<Order> {
    orders.push(order);
    return order;
  }

  async update(order: Order): Promise<Order> {
    const index = orders.findIndex((item) => item.id === order.id);

    if (index === -1) {
      throw new Error('ORDER_NOT_FOUND');
    }

    orders[index] = order;

    return order;
  }
}