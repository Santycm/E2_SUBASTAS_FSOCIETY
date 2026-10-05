import { Request, Response } from 'express';

import { AuctionStatus } from '../../../domain/entities/auction';

import { GetAuctionsUseCase } from '../../../application/use-cases/auctions/get-auctions/get-auctions';
import { CreateAuctionUseCase } from '../../../application/use-cases/auctions/create-auction/create-auction';
import { GetAuctionByIdUseCase } from '../../../application/use-cases/auctions/get-auction-by-id/get-auction-by-id';
import { CancelAuctionUseCase } from '../../../application/use-cases/auctions/cancel-auction/cancel-auction';

export class AuctionsController {
  constructor(
    private readonly getAuctionsUseCase: GetAuctionsUseCase,
    private readonly createAuctionUseCase: CreateAuctionUseCase,
    private readonly getAuctionByIdUseCase: GetAuctionByIdUseCase,
    private readonly cancelAuctionUseCase: CancelAuctionUseCase,
  ) {}

  getAuctions = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const result = await this.getAuctionsUseCase.execute({
      categoryId:
        typeof req.query.categoryId === 'string'
          ? req.query.categoryId
          : undefined,
      status:
        typeof req.query.status === 'string'
          ? req.query.status as AuctionStatus
          : undefined,
      page:
        typeof req.query.page === 'string'
          ? Number(req.query.page)
          : undefined,
      limit:
        typeof req.query.limit === 'string'
          ? Number(req.query.limit)
          : undefined,
    });

    res.json(result);
  };

  createAuction = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const auction = await this.createAuctionUseCase.execute({
      title: req.body.title,
      description: req.body.description,
      categoryId: req.body.categoryId,
      sellerId: req.user!.id,
      basePrice: Number(req.body.basePrice),
      minimumIncrement: Number(req.body.minimumIncrement),
      closesAt: req.body.closesAt,
    });

    res.status(201).json(auction);
  };

  getAuctionById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const auction = await this.getAuctionByIdUseCase.execute(
      req.params.id.toString(),
    );

    if (!auction) {
      res.status(404).json({
        message: 'AUCTION_NOT_FOUND',
      });

      return;
    }

    res.json(auction);
  };

  cancelAuction = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const auction = await this.cancelAuctionUseCase.execute(
      req.params.id.toString(),
    );

    if (!auction) {
      res.status(404).json({
        message: 'AUCTION_NOT_FOUND',
      });

      return;
    }

    res.json(auction);
  };
}