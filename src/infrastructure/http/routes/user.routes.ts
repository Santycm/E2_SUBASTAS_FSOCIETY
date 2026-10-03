import { Router } from 'express';

import { MockUserRepository } from '../../persistence/mock/repositories/mock-user.repository';
import { MockAuctionRepository } from '../../persistence/mock/repositories/mock-auction.repository';
import { MockBidRepository } from '../../persistence/mock/repositories/mock-bid.repository';

import { GetProfileUseCase } from '../../../application/use-cases/users/get-profile/get-profile';

import { UsersController } from '../controllers/user.controller';

const router: Router = Router();

const userRepository = new MockUserRepository();
const auctionRepository = new MockAuctionRepository();
const bidRepository = new MockBidRepository();

const getProfileUseCase = new GetProfileUseCase(
  userRepository,
  auctionRepository,
  bidRepository,
);

const controller = new UsersController(
  getProfileUseCase,
);

router.get('/me', controller.getProfile);

export default router;