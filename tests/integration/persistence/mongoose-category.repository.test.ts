import mongoose, { Types } from 'mongoose';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import { CreateCategoryData } from '../../../src/domain/ports/category.repository';
import { connectMongoDB } from '../../../src/infrastructure/persistence/mongoose/connection';
import { CategoryModel } from '../../../src/infrastructure/persistence/mongoose/models/category.model';
import { MongooseCategoryRepository } from '../../../src/infrastructure/persistence/mongoose/repositories/mongoose-category.repository';

const repository = new MongooseCategoryRepository();
const testDatabaseName = 'e2_subastas_test';

const createCategoryData = (
  overrides: Partial<CreateCategoryData> = {},
): CreateCategoryData => ({
  name: `Category-${new Types.ObjectId().toString()}`,
  description: 'Integration test category',
  ...overrides,
});

describe('MongooseCategoryRepository integration', () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env.test');
    }

    const databaseName = decodeURIComponent(
      new URL(uri).pathname.replace(/^\//, ''),
    );

    if (databaseName !== testDatabaseName) {
      throw new Error(
        `Integration tests require database "${testDatabaseName}", received "${databaseName || '(empty)'}"`,
      );
    }

    await connectMongoDB();

    if (mongoose.connection.name !== testDatabaseName) {
      await mongoose.disconnect();

      throw new Error(
        `Connected to unexpected database: ${mongoose.connection.name}`,
      );
    }
  });

  beforeEach(async () => {
    await CategoryModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('saves a category and maps it to the domain entity', async () => {
    const data = createCategoryData();

    const category = await repository.save(data);

    expect(category).toMatchObject(data);
    expect(Types.ObjectId.isValid(category.id)).toBe(true);
  });

  it('returns all categories ordered by name', async () => {
    await repository.save(createCategoryData({
      name: 'Zebra',
      description: 'Last alphabetically',
    }));
    await repository.save(createCategoryData({
      name: 'Alpha',
      description: 'First alphabetically',
    }));
    await repository.save(createCategoryData({
      name: 'Middle',
      description: 'Middle alphabetically',
    }));

    const categories = await repository.findAll();

    expect(categories.map(({ name }) => name)).toEqual([
      'Alpha',
      'Middle',
      'Zebra',
    ]);
  });

  it('returns an empty array when there are no categories', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('finds a category by ID', async () => {
    const saved = await repository.save(createCategoryData());

    const found = await repository.findById(saved.id);

    expect(found).toEqual(saved);
  });

  it('returns null for an invalid category ID', async () => {
    await expect(repository.findById('invalid-id')).resolves.toBeNull();
  });

  it('returns null when a valid category ID does not exist', async () => {
    await expect(
      repository.findById(new Types.ObjectId().toString()),
    ).resolves.toBeNull();
  });
});
