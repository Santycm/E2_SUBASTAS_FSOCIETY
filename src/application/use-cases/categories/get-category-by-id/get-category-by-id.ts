import { Category } from '../../../../domain/entities/category';
import { CategoryRepository } from '../../../../domain/ports/category.repository';

export class GetCategoryByIdUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(id: string): Promise<Category | null> {
    return this.categoryRepository.findById(id);
  }
}