import { Request, Response } from 'express';

export const register = (_req: Request, res: Response) => {
  res.status(201).json({
    message: 'User registered successfully',
  });
};

export const login = (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'User logged in successfully',
  });
};