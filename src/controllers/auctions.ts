import { Request, Response } from 'express';
import { auctions } from '../data/auctions';

export const getAuctions = (req: Request, res: Response): void => {
  const {
    categoryId,
    status,
    page = '1',
    limit = '10',
  } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  let filteredAuctions = [...auctions];

  if (typeof categoryId === 'string') {
    filteredAuctions = filteredAuctions.filter(
      (auction) => auction.categoryId === categoryId,
    );
  }

  if (typeof status === 'string') {
    filteredAuctions = filteredAuctions.filter(
      (auction) => auction.status === status,
    );
  }

  const total = filteredAuctions.length;
  const totalPages = Math.ceil(total / limitNumber);
  const startIndex = (pageNumber - 1) * limitNumber;
  const endIndex = startIndex + limitNumber;

  const paginatedAuctions = filteredAuctions.slice(
    startIndex,
    endIndex,
  );

  res.status(200).json({
    data: paginatedAuctions,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages,
    },
  });
};

export const createAuction = (
  req: Request,
  res: Response,
): void => {

  const {
    title,
    description,
    categoryId,
    basePrice,
    minimumIncrement,
    closesAt,
  } = req.body;

  const auction = {
    id: `auction-${(auctions.length + 1).toString().padStart(3, '0')}`,
    title,
    description,
    categoryId,
    sellerId: 'user-001',
    basePrice,
    minimumIncrement,
    currentBid: null,
    status: 'OPEN' as const,
    closesAt,
    createdAt: new Date().toISOString(),
  };

  auctions.push(auction);

  res.status(201).json({
    data: auction,
  });
};

export const getAuctionById = (
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

  res.status(200).json({
    data: auction,
  });
};

export const cancelAuction = (
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

  auction.status = 'CANCELLED';

  // Update the auction in the auctions array
  const index = auctions.findIndex(
    (auction) => auction.id === id,
  );
  auctions[index] = auction;

  res.status(200).json({
    data: {
      ...auction,
      status: 'CANCELLED',
    },
  });
};