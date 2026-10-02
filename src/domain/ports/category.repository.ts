import { Category } from '../entities/category';

export interface CategoryRepository {
  findAll(): Promise<Category[]>;

  findById(id: string): Promise<Category | null>;
}