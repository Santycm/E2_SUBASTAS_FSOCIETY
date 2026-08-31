import { Request, Response } from 'express';
import { users } from '../data/users';

export const getProfile = (_req: Request, res: Response) => {
  const user = users[0];

  if (!user) {
    res.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
    return;
  }

  const { password: _password, ...publicUser } = user;

  res.status(200).json({
    data: publicUser,
  });
};