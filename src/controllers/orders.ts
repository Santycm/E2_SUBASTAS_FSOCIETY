import { Request, Response } from 'express';

export const getOrders = (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Orders retrieved successfully',
  });
};

export const getOrder = (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Order retrieved successfully',
  });
};