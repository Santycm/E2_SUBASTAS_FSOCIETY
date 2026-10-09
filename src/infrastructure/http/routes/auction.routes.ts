import { Router } from "express";

import { AuctionsController } from "../controllers/auction.controller";
import { BidsController } from "../controllers/bid.controller";

import { GetAuctionsUseCase } from "../../../application/use-cases/auctions/get-auctions/get-auctions";
import { CreateAuctionUseCase } from "../../../application/use-cases/auctions/create-auction/create-auction";
import { GetAuctionByIdUseCase } from "../../../application/use-cases/auctions/get-auction-by-id/get-auction-by-id";
import { CancelAuctionUseCase } from "../../../application/use-cases/auctions/cancel-auction/cancel-auction";

import { CreateBidUseCase } from "../../../application/use-cases/bids/create-bid/create-bid";
import { GetAuctionBidsUseCase } from "../../../application/use-cases/bids/get-auction-bids/get-auction-bids";

import { MongooseAuctionRepository } from "../../persistence/mongoose/repositories/mongoose-auction.repository";
import { MongooseBidRepository } from "../../persistence/mongoose/repositories/mongoose-bid.repository";
import { MongooseOrderRepository } from "../../persistence/mongoose/repositories/mongoose-order.repository";

import { AuctionEventPublisher } from "../../../domain/ports/auction-event.publisher";

import { authMiddleware } from "../middlewares/auth.middleware";
import { validationMiddleware } from "../middlewares/validation.middleware";

import {
  auctionBidsValidator,
  auctionIdValidator,
  cancelAuctionValidator,
  createAuctionValidator,
  getAuctionsValidator,
} from "../validators/auction.validator";

import { createBidValidator } from "../validators/bid.validator";

const createAuctionRoutes = (
  auctionEventPublisher: AuctionEventPublisher,
): Router => {
  const router: Router = Router();

  const auctionRepository = new MongooseAuctionRepository();
  const bidRepository = new MongooseBidRepository();
  const orderRepository = new MongooseOrderRepository();

  const getAuctionsUseCase = new GetAuctionsUseCase(
    auctionRepository,
    bidRepository,
    orderRepository,
    auctionEventPublisher,
  );

  const createAuctionUseCase = new CreateAuctionUseCase(auctionRepository);

  const getAuctionByIdUseCase = new GetAuctionByIdUseCase(
    auctionRepository,
    bidRepository,
    orderRepository,
    auctionEventPublisher,
  );

  const cancelAuctionUseCase = new CancelAuctionUseCase(auctionRepository);

  const createBidUseCase = new CreateBidUseCase(
    auctionRepository,
    bidRepository,
    orderRepository,
    auctionEventPublisher,
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
    "/",
    getAuctionsValidator,
    validationMiddleware,
    auctionsController.getAuctions,
  );

  router.post(
    "/",
    authMiddleware,
    createAuctionValidator,
    validationMiddleware,
    auctionsController.createAuction,
  );

  router.get(
    "/:id",
    auctionIdValidator,
    validationMiddleware,
    auctionsController.getAuctionById,
  );

  router.patch(
    "/:id/cancel",
    authMiddleware,
    cancelAuctionValidator,
    validationMiddleware,
    auctionsController.cancelAuction,
  );

  router.post(
    "/:id/bids",
    authMiddleware,
    auctionIdValidator,
    createBidValidator,
    validationMiddleware,
    bidsController.createBid,
  );

  router.get(
    "/:id/bids",
    authMiddleware,
    auctionBidsValidator,
    validationMiddleware,
    bidsController.getAuctionBids,
  );

  return router;
};

export default createAuctionRoutes;
