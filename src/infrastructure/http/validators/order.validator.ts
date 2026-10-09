import { param, query, ValidationChain } from 'express-validator';

export const orderIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('ORDER_ID_INVALID'),
];

export const getOrdersValidator: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('PAGE_INVALID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('LIMIT_INVALID'),
  query('status')
    .optional()
    .isIn(['PENDING', 'PAID', 'EXPIRED'])
    .withMessage('ORDER_STATUS_INVALID'),
];

export const getSellerOrdersValidator: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('PAGE_INVALID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('LIMIT_INVALID'),
  query('status')
    .optional()
    .isIn(['PENDING', 'PAID', 'EXPIRED'])
    .withMessage('ORDER_STATUS_INVALID'),
];