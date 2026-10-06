import { body, ValidationChain } from 'express-validator';

export const createBidValidator: ValidationChain[] = [
  body('amount')
    .notEmpty()
    .withMessage('AMOUNT_REQUIRED')
    .isInt({ min: 0 })
    .withMessage('AMOUNT_INVALID'),
];