import { body, param, ValidationChain } from 'express-validator';

export const createCategoryValidator = [
  body('name')
    .isString()
    .withMessage('CATEGORY_NAME_MUST_BE_STRING')
    .trim()
    .notEmpty()
    .withMessage('CATEGORY_NAME_REQUIRED'),

  body('description')
    .isString()
    .withMessage('CATEGORY_DESCRIPTION_MUST_BE_STRING')
    .trim()
    .notEmpty()
    .withMessage('CATEGORY_DESCRIPTION_REQUIRED'),
];

export const categoryIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('CATEGORY_ID_INVALID'),
];