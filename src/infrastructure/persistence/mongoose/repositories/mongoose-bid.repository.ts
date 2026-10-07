import { Types } from 'mongoose';

import { Bid } from '../../../../domain/entities/bid';
import {
  BidRepository,
  CreateBidData,
} from '../../../../domain/ports/bid.repository';

import {
  BidDocument,
  BidModel,
} from '../models/bid.model';

export class MongooseBidRepository implements BidRepository {
  async save(data: CreateBidData): Promise<Bid> {
    const bid = await BidModel.create(data);

    return this.toDomain(bid.toObject());
  }

  async findByAuctionId(auctionId: string): Promise<Bid[]> {
    if (!Types.ObjectId.isValid(auctionId)) {
      return [];
    }

    const bids = await BidModel.find({
      auctionId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return bids.map((bid) => this.toDomain(bid));
  }

  async findByBidderId(bidderId: string): Promise<Bid[]> {
    if (!Types.ObjectId.isValid(bidderId)) {
      return [];
    }

    const bids = await BidModel.find({
      bidderId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return bids.map((bid) => this.toDomain(bid));
  }

  async findHighestAcceptedByAuctionId(
    auctionId: string,
  ): Promise<Bid | null> {
    if (!Types.ObjectId.isValid(auctionId)) {
      return null;
    }

    const bid = await BidModel.findOne({
      auctionId,
      status: 'ACCEPTED',
    })
      .sort({ amount: -1 })
      .lean();

    if (!bid) {
      return null;
    }

    return this.toDomain(bid);
  }

  private toDomain(
    bid:
      | BidDocument
      | {
          _id: Types.ObjectId;
          auctionId: Types.ObjectId;
          bidderId: Types.ObjectId;
          amount: number;
          status: Bid['status'];
          rejectionReason: Bid['rejectionReason'];
          createdAt: Date;
        },
  ): Bid {
    return {
      id: bid._id.toString(),
      auctionId: bid.auctionId.toString(),
      bidderId: bid.bidderId.toString(),
      amount: bid.amount,
      status: bid.status,
      rejectionReason: bid.rejectionReason,
      createdAt: bid.createdAt,
    };
  }
}