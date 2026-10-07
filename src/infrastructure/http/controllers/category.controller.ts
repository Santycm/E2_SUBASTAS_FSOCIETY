import { Request, Response } from 'express';

import { CreateCategoryUseCase } from '../../../application/use-cases/categories/create-category/create-category';
import { GetCategoriesUseCase } from '../../../application/use-cases/categories/get-categories/get-categories';
import { GetCategoryByIdUseCase } from '../../../application/use-cases/categories/get-category-by-id/get-category-by-id';

export class CategoriesController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
  ) {}

  createCategory = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const category = await this.createCategoryUseCase.execute({
      name: req.body.name,
      description: req.body.description,
    });

    res.status(201).json(category);
  };

  getCategories = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    const categories =
      await this.getCategoriesUseCase.execute();

    res.json(categories);
  };

  getCategoryById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const category =
      await this.getCategoryByIdUseCase.execute(
        req.params.id.toString(),
      );

    if (!category) {
      res.status(404).json({
        message: 'CATEGORY_NOT_FOUND',
      });

      return;
    }

    res.json(category);
  };
}