import { Request, Response } from 'express';

import { CreateBidUseCase } from '../../../application/use-cases/bids/create-bid/create-bid';
import { GetAuctionBidsUseCase } from '../../../application/use-cases/bids/get-auction-bids/get-auction-bids';

export class BidsController {
  constructor(
    private readonly createBidUseCase: CreateBidUseCase,
    private readonly getAuctionBidsUseCase: GetAuctionBidsUseCase,
  ) {}

  createBid = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const result = await this.createBidUseCase.execute({
      auctionId: req.params.id.toString(),
      bidderId: req.body.bidderId,
      amount: Number(req.body.amount),
    });

    if (!result) {
      res.status(404).json({
        message: 'AUCTION_NOT_FOUND',
      });

      return;
    }

    res.status(201).json(result);
  };

  getAuctionBids = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const result = await this.getAuctionBidsUseCase.execute({
      auctionId: req.params.id.toString(),
    });

    if (!result) {
      res.status(404).json({
        message: 'AUCTION_NOT_FOUND',
      });

      return;
    }

    res.json(result.bids);
  };
}