import { Request, Response } from "express";
import { users } from "../data/users";
import { auctions, bids } from "../data/auctions";

export const getProfile = (_req: Request, res: Response): void => {
  const user = users[0];

  if (!user) {
    res.status(404).json({
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found",
      },
    });
    return;
  }

  // Exclude the password from the user object before sending the response
  const { password: _password, ...publicUser } = user;

  // Get the auctions published by the user
  const publishedAuctions = auctions.filter(
    (auction) => auction.sellerId === user.id,
  );

  // Get the auctions in which the user has participated by placing bids
  // new Set() is used to ensure that each auction ID is unique because a user can place multiple bids on the same auction
  const participatedAuctionIds = [
    ...new Set(
      bids
        .filter((bid) => bid.bidderId === user.id)
        .map((bid) => bid.auctionId),
    ),
  ];

  const participatedAuctions = auctions.filter((auction) =>
    participatedAuctionIds.includes(auction.id),
  );

  res.status(200).json({
    data: {
      ...publicUser,
      publishedAuctions,
      participatedAuctions,
    },
  });
};
