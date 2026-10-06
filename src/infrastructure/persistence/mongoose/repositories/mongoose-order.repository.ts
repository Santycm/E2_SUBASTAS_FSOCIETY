import { Types } from "mongoose";

import { Order } from "../../../../domain/entities/order";
import {
  CreateOrderData,
  FindOrdersFilters,
  FindOrdersResult,
  OrderRepository,
} from "../../../../domain/ports/order.repository";
import { OrderModel } from "../models/order.model";

export class MongooseOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const order = await OrderModel.findById(id).lean();

    if (!order) {
      return null;
    }

    return this.toDomain(order);
  }

  async findByAuctionId(auctionId: string): Promise<Order | null> {
    const order = await OrderModel.findOne({
      auctionId,
    }).lean();

    if (!order) {
      return null;
    }

    return this.toDomain(order);
  }

  async findByBuyerId(
    buyerId: string,
    filters: FindOrdersFilters,
  ): Promise<FindOrdersResult> {
    const query: {
      buyerId: string;
      status?: Order["status"];
    } = {
      buyerId,
    };

    if (filters.status) {
      query.status = filters.status;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),

      OrderModel.countDocuments(query),
    ]);

    return {
      data: orders.map((order) => this.toDomain(order)),
      total,
    };
  }

  async findByAuctionIds(
    auctionIds: string[],
    filters: FindOrdersFilters,
  ): Promise<FindOrdersResult> {
    if (auctionIds.length === 0) {
      return {
        data: [],
        total: 0,
      };
    }

    const query: {
      auctionId: { $in: string[] };
      status?: Order["status"];
    } = {
      auctionId: {
        $in: auctionIds,
      },
    };

    if (filters.status) {
      query.status = filters.status;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),

      OrderModel.countDocuments(query),
    ]);

    return {
      data: orders.map((order) => this.toDomain(order)),
      total,
    };
  }

  async save(data: CreateOrderData): Promise<Order> {
    const savedOrder = await OrderModel.create(data);

    return this.toDomain(savedOrder.toObject());
  }

  async update(order: Order): Promise<Order> {
    if (!Types.ObjectId.isValid(order.id)) {
      throw new Error("INVALID_ORDER_ID");
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      order.id,
      {
        auctionId: order.auctionId,
        buyerId: order.buyerId,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).lean();

    if (!updatedOrder) {
      throw new Error("ORDER_NOT_FOUND");
    }

    return this.toDomain(updatedOrder);
  }

  private toDomain(order: {
    _id: Types.ObjectId;
    auctionId: string;
    buyerId: string;
    amount: number;
    status: Order["status"];
    createdAt: Date;
    expiresAt: Date;
  }): Order {
    return {
      id: order._id.toString(),
      auctionId: order.auctionId,
      buyerId: order.buyerId,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt,
      expiresAt: order.expiresAt,
    };
  }
}