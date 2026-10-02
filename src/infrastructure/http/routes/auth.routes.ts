import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';

import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user/register-user';
import { LoginUserUseCase } from '../../../application/use-cases/auth/login-user/login-user';

import { MockUserRepository } from '../../persistence/mock/repositories/mock-user.repository';

const router: Router = Router();

const userRepository = new MockUserRepository();

const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
);

const loginUserUseCase = new LoginUserUseCase(
  userRepository,
);

const controller = new AuthController(
  registerUserUseCase,
  loginUserUseCase,
);

router.post('/register', controller.register);
router.post('/login', controller.login);

export default router;