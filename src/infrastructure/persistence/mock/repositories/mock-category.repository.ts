import { CategoryRepository } from '../../../../domain/ports/category.repository';
import { Category } from '../../../../domain/entities/category';
import { categoriesData } from '../data/categories.data';

export class MockCategoryRepository implements CategoryRepository {
  async findAll(): Promise<Category[]> {
    return categoriesData;
  }

  async findById(id: string): Promise<Category | null> {
    return categoriesData.find(
      category => category.id === id,
    ) ?? null;
  }
}