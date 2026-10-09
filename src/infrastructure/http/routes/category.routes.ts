import { Router } from 'express';

import { CreateCategoryUseCase } from '../../../application/use-cases/categories/create-category/create-category';
import { GetCategoriesUseCase } from '../../../application/use-cases/categories/get-categories/get-categories';
import { GetCategoryByIdUseCase } from '../../../application/use-cases/categories/get-category-by-id/get-category-by-id';

import { CategoriesController } from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validationMiddleware } from '../middlewares/validation.middleware';
import { categoryIdValidator, createCategoryValidator } from '../validators/category.validator';

import { MongooseCategoryRepository } from '../../persistence/mongoose/repositories/mongoose-category.repository';

const router: Router = Router();

const categoryRepository = new MongooseCategoryRepository();

const createCategoryUseCase = new CreateCategoryUseCase(
  categoryRepository,
);

const getCategoriesUseCase = new GetCategoriesUseCase(
  categoryRepository,
);

const getCategoryByIdUseCase = new GetCategoryByIdUseCase(
  categoryRepository,
);

const controller = new CategoriesController(
  createCategoryUseCase,
  getCategoriesUseCase,
  getCategoryByIdUseCase,
);

router.get('/', controller.getCategories);

router.get(
  '/:id',
  categoryIdValidator,
  validationMiddleware,
  controller.getCategoryById,
);

router.post(
  '/',
  authMiddleware,
  createCategoryValidator,
  validationMiddleware,
  controller.createCategory,
);

export default router;