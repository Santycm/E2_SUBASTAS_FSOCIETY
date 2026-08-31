import { Request, Response } from 'express';
import { categories } from '../data/categories';

export const getCategories = (_req: Request, res: Response) => {
  res.status(200).json({
    data: categories,
  });
};

export const getCategoryById = (req: Request, res: Response) => {
  const category = categories.find(
    (category) => category.id === req.params.id,
  );

  if (!category) {
    res.status(404).json({
      error: {
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      },
    });
    return;
  }

  res.status(200).json({
    data: category,
  });
};