import { query, body, param, ValidationChain } from 'express-validator';

export const createAuctionValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('TITLE_REQUIRED'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('DESCRIPTION_REQUIRED'),

  body('categoryId')
    .trim()
    .notEmpty()
    .withMessage('CATEGORY_ID_REQUIRED'),

  body('basePrice')
    .notEmpty()
    .withMessage('BASE_PRICE_REQUIRED')
    .isInt({ min: 1 })
    .withMessage('BASE_PRICE_INVALID'),

  body('minimumIncrement')
    .notEmpty()
    .withMessage('MINIMUM_INCREMENT_REQUIRED')
    .isInt({ min: 1 })
    .withMessage('MINIMUM_INCREMENT_INVALID'),

  body('closesAt')
    .notEmpty()
    .withMessage('CLOSES_AT_REQUIRED')
    .isISO8601()
    .withMessage('CLOSES_AT_INVALID'),
];

export const getAuctionsValidator: ValidationChain[] = [
  query('categoryId')
    .optional()
    .isString()
    .withMessage('CATEGORY_ID_INVALID'),

  query('status')
    .optional()
    .isIn([
      'OPEN',
      'CLOSED',
      'CANCELLED',
      'NO_BIDS',
    ])
    .withMessage('STATUS_INVALID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('PAGE_INVALID'),

  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('LIMIT_INVALID'),
];

export const auctionIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('AUCTION_ID_INVALID'),
];

export const cancelAuctionValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('AUCTION_ID_INVALID'),
];

export const auctionBidsValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('AUCTION_ID_INVALID'),
];