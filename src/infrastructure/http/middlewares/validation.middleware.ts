import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

export const validationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'VALIDATION_ERROR',
      errors: errors.array(),
    });
    return;
  }

  next();
};