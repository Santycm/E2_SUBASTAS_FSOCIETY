import { Router } from "express";

import { MongooseUserRepository } from "../../persistence/mongoose/repositories/mongoose-user.repository";
import { BcryptPasswordHasher } from "../../security/bcrypt-password-hasher";
import { JwtTokenService } from "../../security/jwt-token-service";

import { RegisterUserUseCase } from "../../../application/use-cases/auth/register-user/register-user";
import { LoginUserUseCase } from "../../../application/use-cases/auth/login-user/login-user";

import { AuthController } from "../controllers/auth.controller";
import {
  loginValidator,
  registerValidator,
} from "../validators/auth.validator";
import { validationMiddleware } from "../middlewares/validation.middleware";

const router: Router = Router();

const userRepository = new MongooseUserRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();

const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  passwordHasher,
);

const loginUserUseCase = new LoginUserUseCase(
  userRepository,
  passwordHasher,
  tokenService,
);

const controller = new AuthController(registerUserUseCase, loginUserUseCase);

router.post(
  "/register",
  registerValidator,
  validationMiddleware,
  controller.register,
);

router.post("/login", loginValidator, validationMiddleware, controller.login);

export default router;
