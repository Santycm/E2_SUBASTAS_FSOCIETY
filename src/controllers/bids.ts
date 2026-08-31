import { Request, Response } from 'express';

export const createBid = (_req: Request, res: Response) => {
  res.status(201).json({
    message: 'Bid created successfully',
  });
};

export const getBids = (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Bids retrieved successfully',
  });
};