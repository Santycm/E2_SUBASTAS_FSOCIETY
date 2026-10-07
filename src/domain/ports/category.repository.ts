import { Category } from '../entities/category';

export interface CreateCategoryData {
  name: string;
  description: string;
}

export interface CategoryRepository {
  findAll(): Promise<Category[]>;

  findById(id: string): Promise<Category | null>;

  save(data: CreateCategoryData): Promise<Category>;
}