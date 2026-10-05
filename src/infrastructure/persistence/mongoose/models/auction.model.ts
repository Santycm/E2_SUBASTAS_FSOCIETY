import { Document, Schema, model } from 'mongoose';

import { AuctionStatus } from '../../../../domain/entities/auction';

export interface AuctionDocument extends Document {
  title: string;
  description: string;
  categoryId: string;
  sellerId: string;
  basePrice: number;
  minimumIncrement: number;
  currentBid: number | null;
  status: AuctionStatus;
  closesAt: Date;
  createdAt: Date;
}

const auctionSchema = new Schema<AuctionDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: String,
      required: true,
      trim: true,
    },
    sellerId: {
      type: String,
      required: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    minimumIncrement: {
      type: Number,
      required: true,
    },
    currentBid: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'CANCELLED', 'NO_BIDS'],
      required: true,
      default: 'OPEN',
    },
    closesAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

export const AuctionModel = model<AuctionDocument>(
  'Auction',
  auctionSchema,
);