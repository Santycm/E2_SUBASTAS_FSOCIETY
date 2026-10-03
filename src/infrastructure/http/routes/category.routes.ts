import { Router } from 'express';

import { authMiddleware } from '../middlewares/auth.middleware';
import { CategoriesController } from '../controllers/category.controller';

import { GetCategoriesUseCase } from '../../../application/use-cases/categories/get-categories/get-categories';
import { GetCategoryByIdUseCase } from '../../../application/use-cases/categories/get-category-by-id/get-category-by-id';

import { MockCategoryRepository } from '../../persistence/mock/repositories/mock-category.repository';

const router: Router = Router();

const categoryRepository = new MockCategoryRepository();

const getCategoriesUseCase = new GetCategoriesUseCase(
  categoryRepository,
);

const getCategoryByIdUseCase = new GetCategoryByIdUseCase(
  categoryRepository,
);

const controller = new CategoriesController(
  getCategoriesUseCase,
  getCategoryByIdUseCase,
);

router.get('/', authMiddleware, controller.getCategories);
router.get('/:id', authMiddleware, controller.getCategoryById);

export default router;