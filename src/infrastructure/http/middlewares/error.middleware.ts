import { ErrorRequestHandler } from 'express';

import { ApplicationError } from '../../../application/errors/application-error';

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApplicationError) {
    res.status(error.statusCode).json({
      message: error.code,
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    'body' in error
  ) {
    res.status(400).json({
      message: 'INVALID_JSON',
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    res.status(409).json({
      message: 'RESOURCE_ALREADY_EXISTS',
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'ValidationError'
  ) {
    res.status(400).json({
      message: 'VALIDATION_ERROR',
    });
    return;
  }

  console.error('[HTTP] INTERNAL_SERVER_ERROR:', error);

  res.status(500).json({
    message: 'INTERNAL_SERVER_ERROR',
  });
};
