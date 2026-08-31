import { Request, Response } from 'express';
import { auctions, bids } from '../data/auctions';

export const createBid = (
  req: Request,
  res: Response,
): void => {
  const { id } = req.params;
  const { amount } = req.body;

  const auction = auctions.find(
    (auction) => auction.id === id,
  );

  if (!auction) {
    res.status(404).json({
      error: {
        code: 'AUCTION_NOT_FOUND',
        message: 'Auction not found',
      },
    });

    return;
  }

  const bid = {
    id: `bid-${(bids.length + 1).toString().padStart(3, '0')}`,
    auctionId: id.toString(),
    bidderId: 'user-004',
    amount: Number(amount),
    createdAt: new Date().toISOString(),
  };

  bids.push(bid);

  res.status(201).json({
    data: {
      bid,
      auction,
      bidderId: 'user-004',
      currentBid: amount,
    },
  });
};

export const getAuctionBids = (
  req: Request,
  res: Response,
): void => {
  const { id } = req.params;

  const auction = auctions.find(
    (auction) => auction.id === id,
  );

  if (!auction) {
    res.status(404).json({
      error: {
        code: 'AUCTION_NOT_FOUND',
        message: 'Auction not found',
      },
    });

    return;
  }

  const auctionBids = bids.filter(
    (bid) => bid.auctionId === id,
  );

  res.status(200).json({
    data: auctionBids,
  });
};