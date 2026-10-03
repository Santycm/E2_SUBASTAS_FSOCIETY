import { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (
    error instanceof SyntaxError &&
    typeof error === 'object' &&
    error !== null &&
    'body' in error
  ) {
    res.status(400).json({
      message: 'INVALID_JSON',
    });
    return;
  }

  next(error);
};