import { Request, Response } from 'express';

export const getProfile = (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'User profile retrieved successfully',
  });
};