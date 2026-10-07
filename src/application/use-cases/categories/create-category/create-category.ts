import { Category } from '../../../../domain/entities/category';
import { CategoryRepository } from '../../../../domain/ports/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';

export class CreateCategoryUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(dto: CreateCategoryDto): Promise<Category> {
    return this.categoryRepository.save({
      name: dto.name.trim(),
      description: dto.description.trim(),
    });
  }
}