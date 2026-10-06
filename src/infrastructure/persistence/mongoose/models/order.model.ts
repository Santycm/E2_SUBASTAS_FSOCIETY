import { Document, Schema, model } from 'mongoose';

import { OrderStatus } from '../../../../domain/entities/order';

export interface OrderDocument extends Document {
  auctionId: string;
  buyerId: string;
  amount: number;
  status: OrderStatus;
  createdAt: Date;
  expiresAt: Date;
}

const orderSchema = new Schema<OrderDocument>(
  {
    auctionId: {
      type: String,
      required: true,
      trim: true,
    },
    buyerId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'EXPIRED'],
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

orderSchema.index({ auctionId: 1 }, { unique: true });
orderSchema.index({ buyerId: 1 });

export const OrderModel = model<OrderDocument>(
  'Order',
  orderSchema,
);