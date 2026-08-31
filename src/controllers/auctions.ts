import { Request, Response } from 'express';

export const getAuctions = (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Auctions retrieved successfully',
  });
};

export const createAuction = (_req: Request, res: Response) => {
  res.status(201).json({
    message: 'Auction created successfully',
  });
};

export const getAuction = (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Auction retrieved successfully',
  });
};

export const cancelAuction = (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Auction cancelled successfully',
  });
};