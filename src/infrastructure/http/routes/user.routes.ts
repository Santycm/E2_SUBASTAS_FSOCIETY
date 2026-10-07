import { Router } from 'express';

import { GetProfileUseCase } from '../../../application/use-cases/users/get-profile/get-profile';

import { UsersController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

import { MongooseUserRepository } from '../../persistence/mongoose/repositories/mongoose-user.repository';
import { MongooseAuctionRepository } from '../../persistence/mongoose/repositories/mongoose-auction.repository';
import { MongooseBidRepository } from '../../persistence/mongoose/repositories/mongoose-bid.repository';

const router: Router = Router();

const userRepository = new MongooseUserRepository();
const auctionRepository = new MongooseAuctionRepository();
const bidRepository = new MongooseBidRepository();

const getProfileUseCase = new GetProfileUseCase(
  userRepository,
  auctionRepository,
  bidRepository,
);

const controller = new UsersController(
  getProfileUseCase,
);

router.get(
  '/me',
  authMiddleware,
  controller.getProfile,
);

export default router;