import { body, ValidationChain } from "express-validator";

export const registerValidator: ValidationChain[] = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("NAME_REQUIRED")
    .isLength({ min: 2, max: 100 })
    .withMessage("NAME_INVALID"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("EMAIL_REQUIRED")
    .isEmail()
    .withMessage("EMAIL_INVALID")
    .isLength({ max: 254 })
    .withMessage("EMAIL_INVALID")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("PASSWORD_INVALID")
    .bail()
    .notEmpty()
    .withMessage("PASSWORD_REQUIRED")
    .isLength({ min: 8 })
    .withMessage("PASSWORD_TOO_SHORT")
    .custom((value: string) => value.trim().length > 0)
    .withMessage("PASSWORD_INVALID"),
];

export const loginValidator: ValidationChain[] = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("EMAIL_REQUIRED")
    .isEmail()
    .withMessage("EMAIL_INVALID")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("PASSWORD_REQUIRED"),
];
