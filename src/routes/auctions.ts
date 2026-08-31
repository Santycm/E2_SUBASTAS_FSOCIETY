import { Router } from "express";
import {
  getAuctions,
  createAuction,
  getAuction,
  cancelAuction,
} from "../controllers/auctions";

import { createBid, getBids } from "../controllers/bids";

const router: Router = Router();

router.get("/", getAuctions);
router.post("/", createAuction);
router.get("/:id", getAuction);
router.post("/:id/cancel", cancelAuction);
router.post("/:id/bids", createBid);
router.get("/:id/bids", getBids);

export default router;
