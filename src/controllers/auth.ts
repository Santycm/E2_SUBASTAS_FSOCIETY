import { Request, Response } from 'express';
import { users } from '../data/users';

export const register = (req: Request, res: Response): void => {
  const { name, email, password } = req.body;

  const user = {
    id: `user-${users.length + 1}`,
    name,
    email,
    password,
  };

  users.push(user);

  res.status(201).json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = users.find(
    (user) => user.email === email && user.password === password,
  );

  if (!user) {
    res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
    return;
  }

  res.status(200).json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token: 'fake-jwt-token',
  });
};