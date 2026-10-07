import { Document, Schema, Types, model } from 'mongoose';

import {
  BidRejectionReason,
  BidStatus,
} from '../../../../domain/entities/bid';

export interface BidDocument extends Document {
  auctionId: Types.ObjectId;
  bidderId: Types.ObjectId;
  amount: number;
  status: BidStatus;
  rejectionReason: BidRejectionReason | null;
  createdAt: Date;
}

const bidSchema = new Schema<BidDocument>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
    },
    bidderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACCEPTED', 'REJECTED'],
      required: true,
    },
    rejectionReason: {
      type: String,
      enum: [
        'AUCTION_NOT_OPEN',
        'AUCTION_CLOSED',
        'SELLER_CANNOT_BID',
        'LEADING_BIDDER_CANNOT_OUTBID_SELF',
        'AMOUNT_BELOW_MINIMUM',
        'AUCTION_CANCELLED',
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

bidSchema.index({
  auctionId: 1,
  status: 1,
  amount: -1,
});

bidSchema.index({
  bidderId: 1,
  createdAt: -1,
});

export const BidModel = model<BidDocument>(
  'Bid',
  bidSchema,
);