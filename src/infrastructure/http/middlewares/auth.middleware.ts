import { NextFunction, Request, Response } from 'express';

import { JwtTokenService } from '../../security/jwt-token-service';

const tokenService = new JwtTokenService();

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    res.status(401).json({
      message: 'UNAUTHORIZED',
    });
    return;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({
      message: 'INVALID_AUTHORIZATION_HEADER',
    });
    return;
  }

  try {
    const payload = tokenService.verify(token);

    req.user = {
      id: payload.userId,
    };

    next();
  } catch {
    res.status(401).json({
      message: 'INVALID_TOKEN',
    });
  }
};