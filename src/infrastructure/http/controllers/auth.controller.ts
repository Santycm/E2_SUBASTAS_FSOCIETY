import { Request, Response } from 'express';

import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user/register-user';
import { LoginUserUseCase } from '../../../application/use-cases/auth/login-user/login-user';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  register = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const result = await this.registerUserUseCase.execute({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    res.status(201).json(result);
  };

  login = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const result = await this.loginUserUseCase.execute({
      email: req.body.email,
      password: req.body.password,
    });

    if (!result) {
      res.status(401).json({
        message: 'INVALID_CREDENTIALS',
      });

      return;
    }

    res.json(result);
  };
}