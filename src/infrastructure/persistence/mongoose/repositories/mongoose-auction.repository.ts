import { Types } from 'mongoose';

import { Auction } from '../../../../domain/entities/auction';
import {
  AuctionRepository,
  CreateAuctionData,
  FindAuctionsFilters,
  FindAuctionsResult,
} from '../../../../domain/ports/auction.repository';

import {
  AuctionDocument,
  AuctionModel,
} from '../models/auction.model';

export class MongooseAuctionRepository implements AuctionRepository {
  async findAll(
    filters: FindAuctionsFilters,
  ): Promise<FindAuctionsResult> {
    const query: {
      categoryId?: string;
      status?: Auction['status'];
    } = {};

    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [auctions, total] = await Promise.all([
      AuctionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),

      AuctionModel.countDocuments(query),
    ]);

    return {
      data: auctions.map((auction) => this.toDomain(auction)),
      total,
    };
  }

  async findById(id: string): Promise<Auction | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const auction = await AuctionModel.findById(id).lean();

    if (!auction) {
      return null;
    }

    return this.toDomain(auction);
  }

  async findBySellerId(sellerId: string): Promise<Auction[]> {
    const auctions = await AuctionModel.find({
      sellerId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return auctions.map((auction) => this.toDomain(auction));
  }

  async save(data: CreateAuctionData): Promise<Auction> {
    const auction = await AuctionModel.create(data);

    return this.toDomain(auction.toObject());
  }

  async update(auction: Auction): Promise<Auction> {
    if (!Types.ObjectId.isValid(auction.id)) {
      throw new Error('INVALID_AUCTION_ID');
    }

    const updatedAuction = await AuctionModel.findByIdAndUpdate(
      auction.id,
      {
        title: auction.title,
        description: auction.description,
        categoryId: auction.categoryId,
        sellerId: auction.sellerId,
        basePrice: auction.basePrice,
        minimumIncrement: auction.minimumIncrement,
        currentBid: auction.currentBid,
        status: auction.status,
        closesAt: auction.closesAt,
        createdAt: auction.createdAt,
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (!updatedAuction) {
      throw new Error('AUCTION_NOT_FOUND');
    }

    return this.toDomain(updatedAuction);
  }

  private toDomain(
    auction: AuctionDocument | {
      _id: Types.ObjectId;
      title: string;
      description: string;
      categoryId: string;
      sellerId: string;
      basePrice: number;
      minimumIncrement: number;
      currentBid: number | null;
      status: Auction['status'];
      closesAt: Date;
      createdAt: Date;
    },
  ): Auction {
    return {
      id: auction._id.toString(),
      title: auction.title,
      description: auction.description,
      categoryId: auction.categoryId,
      sellerId: auction.sellerId,
      basePrice: auction.basePrice,
      minimumIncrement: auction.minimumIncrement,
      currentBid: auction.currentBid,
      status: auction.status,
      closesAt: auction.closesAt,
      createdAt: auction.createdAt,
    };
  }
}