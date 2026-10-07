import { Router } from 'express';

import { CategoriesController } from '../controllers/category.controller';

import { GetCategoriesUseCase } from '../../../application/use-cases/categories/get-categories/get-categories';
import { GetCategoryByIdUseCase } from '../../../application/use-cases/categories/get-category-by-id/get-category-by-id';

import { MongooseCategoryRepository } from '../../persistence/mongoose/repositories/mongoose-category.repository';

const router: Router = Router();

const categoryRepository = new MongooseCategoryRepository();

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

router.get('/', controller.getCategories);

router.get('/:id', controller.getCategoryById);

export default router;