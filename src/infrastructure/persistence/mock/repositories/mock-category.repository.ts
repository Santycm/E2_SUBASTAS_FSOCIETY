import { Category } from '../../../../domain/entities/category';
import {
  CategoryRepository,
  CreateCategoryData,
} from '../../../../domain/ports/category.repository';

import { categoriesData } from '../data/categories.data';

export class MockCategoryRepository implements CategoryRepository {
  async findAll(): Promise<Category[]> {
    return categoriesData;
  }

  async findById(id: string): Promise<Category | null> {
    return categoriesData.find((category) => category.id === id) ?? null;
  }

  async save(data: CreateCategoryData): Promise<Category> {
    const category: Category = {
      id: `cat-${categoriesData.length + 1}`,
      name: data.name,
      description: data.description,
    };

    categoriesData.push(category);

    return category;
  }
}