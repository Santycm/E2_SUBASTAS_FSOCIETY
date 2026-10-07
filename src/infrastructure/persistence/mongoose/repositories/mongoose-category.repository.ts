import { Types } from 'mongoose';

import { Category } from '../../../../domain/entities/category';
import { CategoryRepository } from '../../../../domain/ports/category.repository';

import {
  CategoryDocument,
  CategoryModel,
} from '../models/category.model';

export class MongooseCategoryRepository implements CategoryRepository {
  async findAll(): Promise<Category[]> {
    const categories = await CategoryModel.find()
      .sort({ name: 1 })
      .lean();

    return categories.map((category) => this.toDomain(category));
  }

  async findById(id: string): Promise<Category | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const category = await CategoryModel.findById(id).lean();

    if (!category) {
      return null;
    }

    return this.toDomain(category);
  }

  private toDomain(
    category:
      | CategoryDocument
      | {
          _id: Types.ObjectId;
          name: string;
          description: string;
        },
  ): Category {
    return {
      id: category._id.toString(),
      name: category.name,
      description: category.description,
    };
  }
}