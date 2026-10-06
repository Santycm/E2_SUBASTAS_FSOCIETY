import { Document, Schema, model } from "mongoose";

import {
  BidRejectionReason,
  BidStatus,
} from "../../../../domain/entities/bid";

export interface BidDocument extends Document {
  auctionId: string;
  bidderId: string;
  amount: number;
  status: BidStatus;
  rejectionReason: BidRejectionReason | null;
  createdAt: Date;
}

const bidSchema = new Schema<BidDocument>(
  {
    auctionId: {
      type: String,
      required: true,
      trim: true,
    },
    bidderId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACCEPTED", "REJECTED"],
      required: true,
    },
    rejectionReason: {
      type: String,
      enum: [
        "AUCTION_NOT_OPEN",
        "AUCTION_CLOSED",
        "SELLER_CANNOT_BID",
        "LEADING_BIDDER_CANNOT_OUTBID_SELF",
        "AMOUNT_BELOW_MINIMUM",
        "AUCTION_CANCELLED",
      ],
      default: null,
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

bidSchema.index({ auctionId: 1, status: 1, amount: -1 });

export const BidModel = model<BidDocument>("Bid", bidSchema);