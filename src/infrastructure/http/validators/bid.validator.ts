import { body, ValidationChain } from 'express-validator';

export const createBidValidator: ValidationChain[] = [
  body('amount')
    .exists()
    .withMessage('AMOUNT_REQUIRED')
    .bail()
    .isInt({ min: 1 })
    .withMessage('AMOUNT_INVALID'),
];