import { Request, Response } from 'express';

export const handleWebhook = (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Payment webhook received successfully',
  });
};