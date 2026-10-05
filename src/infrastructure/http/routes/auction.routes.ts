import { Router } from 'express';

import { AuctionsController } from '../controllers/auction.controller';
import { BidsController } from '../controllers/bid.controller';

import { GetAuctionsUseCase } from '../../../application/use-cases/auctions/get-auctions/get-auctions';
import { CreateAuctionUseCase } from '../../../application/use-cases/auctions/create-auction/create-auction';
import { GetAuctionByIdUseCase } from '../../../application/use-cases/auctions/get-auction-by-id/get-auction-by-id';
import { CancelAuctionUseCase } from '../../../application/use-cases/auctions/cancel-auction/cancel-auction';

import { CreateBidUseCase } from '../../../application/use-cases/bids/create-bid/create-bid';
import { GetAuctionBidsUseCase } from '../../../application/use-cases/bids/get-auction-bids/get-auction-bids';

import { MongooseAuctionRepository } from '../../persistence/mongoose/repositories/mongoose-auction.repository';
import { MockBidRepository } from '../../persistence/mock/repositories/mock-bid.repository';

import { authMiddleware } from '../middlewares/auth.middleware';
import { validationMiddleware } from '../middlewares/validation.middleware';
import {
  createAuctionValidator,
  getAuctionsValidator,
} from '../validators/auction.validator';

const router: Router = Router();

const auctionRepository = new MongooseAuctionRepository();
const bidRepository = new MockBidRepository();

const getAuctionsUseCase = new GetAuctionsUseCase(
  auctionRepository,
);

const createAuctionUseCase = new CreateAuctionUseCase(
  auctionRepository,
);

const getAuctionByIdUseCase = new GetAuctionByIdUseCase(
  auctionRepository,
);

const cancelAuctionUseCase = new CancelAuctionUseCase(
  auctionRepository,
);

const createBidUseCase = new CreateBidUseCase(
  auctionRepository,
  bidRepository,
);

const getAuctionBidsUseCase = new GetAuctionBidsUseCase(
  auctionRepository,
  bidRepository,
);

const auctionsController = new AuctionsController(
  getAuctionsUseCase,
  createAuctionUseCase,
  getAuctionByIdUseCase,
  cancelAuctionUseCase,
);

const bidsController = new BidsController(
  createBidUseCase,
  getAuctionBidsUseCase,
);

router.get(
  '/',
  getAuctionsValidator,
  validationMiddleware,
  auctionsController.getAuctions,
);

router.post(
  '/',
  authMiddleware,
  createAuctionValidator,
  validationMiddleware,
  auctionsController.createAuction,
);

router.get('/:id', auctionsController.getAuctionById);

router.post('/:id/cancel', auctionsController.cancelAuction);

router.post('/:id/bids', bidsController.createBid);
router.get('/:id/bids', bidsController.getAuctionBids);

export default router;