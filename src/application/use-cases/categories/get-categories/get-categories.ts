import { Category } from '../../../../domain/entities/category';
import { CategoryRepository } from '../../../../domain/ports/category.repository';

export class GetCategoriesUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }
}