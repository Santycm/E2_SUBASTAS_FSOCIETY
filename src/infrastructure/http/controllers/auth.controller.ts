import { Request, Response } from "express";

import { RegisterUserUseCase } from "../../../application/use-cases/auth/register-user/register-user";
import { LoginUserUseCase } from "../../../application/use-cases/auth/login-user/login-user";

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.registerUserUseCase.execute(req.body);

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "USER_ALREADY_EXISTS") {
        res.status(409).json({
          message: "USER_ALREADY_EXISTS",
        });

        return;
      }
      
      res.status(500).json({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.loginUserUseCase.execute(req.body);

    if (!result) {
      res.status(401).json({
        message: "INVALID_CREDENTIALS",
      });

      return;
    }

    res.json(result);
  };
}
