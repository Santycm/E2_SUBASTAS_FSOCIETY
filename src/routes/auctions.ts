import { Router } from "express";
import {
  getAuctions,
  createAuction,
  getAuctionById,
  cancelAuction,
} from "../controllers/auctions";
import { createBid, getAuctionBids } from "../controllers/bids";

const router: Router = Router();

router.get("/", getAuctions);
router.post("/", createAuction);
router.get("/:id", getAuctionById);
router.post("/:id/cancel", cancelAuction);
router.post("/:id/bids", createBid);
router.get("/:id/bids", getAuctionBids);

export default router;
