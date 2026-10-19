import mongoose, { Types } from 'mongoose';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { ApplicationError } from '../../../src/application/errors/application-error';
import { connectMongoDB } from '../../../src/infrastructure/persistence/mongoose/connection';
import { UserModel } from '../../../src/infrastructure/persistence/mongoose/models/user.model';
import { MongooseUserRepository } from '../../../src/infrastructure/persistence/mongoose/repositories/mongoose-user.repository';

describe('MongooseUserRepository integration', () => {
  const repository = new MongooseUserRepository();

  const testDatabaseName = 'e2_subastas_test';

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        '[MongoDB] MONGODB_URI is not defined in .env.test',
      );
    }

    const databaseName = new URL(uri).pathname.replace(/^\//, '');

    if (databaseName !== testDatabaseName) {
      throw new Error(
        `Integration tests require database "${testDatabaseName}", received "${databaseName || '(empty)'}"`,
      );
    }

    await connectMongoDB();
    await UserModel.init();

    expect(mongoose.connection.name).toBe(testDatabaseName);
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('save', () => {
    it('saves a user and maps MongoDB fields to the domain entity', async () => {
      const user = await repository.save({
        name: 'Santiago Castaño',
        email: 'santiago@example.com',
        password: 'hashed-password',
      });

      expect(user).toEqual({
        id: expect.any(String),
        name: 'Santiago Castaño',
        email: 'santiago@example.com',
        password: 'hashed-password',
      });

      expect(Types.ObjectId.isValid(user.id)).toBe(true);

      const persistedUser = await UserModel.findById(user.id).lean();

      expect(persistedUser).not.toBeNull();
      expect(persistedUser?.name).toBe('Santiago Castaño');
      expect(persistedUser?.email).toBe('santiago@example.com');
      expect(persistedUser?.password).toBe('hashed-password');
    });

    it('normalizes the email to lowercase and trims it', async () => {
      const user = await repository.save({
        name: '  Santiago  ',
        email: '  SANTIAGO@EXAMPLE.COM  ',
        password: 'hashed-password',
      });

      expect(user.name).toBe('Santiago');
      expect(user.email).toBe('santiago@example.com');
    });

    it('throws USER_EMAIL_ALREADY_EXISTS when the email is duplicated', async () => {
      const userData = {
        name: 'Santiago',
        email: 'santiago@example.com',
        password: 'hashed-password',
      };

      await repository.save(userData);

      await expect(repository.save(userData)).rejects.toMatchObject({
        message: 'USER_EMAIL_ALREADY_EXISTS',
        statusCode: 409,
      } satisfies Partial<ApplicationError>);
    });
  });

  describe('findAll', () => {
    it('returns all users mapped to domain entities', async () => {
      await repository.save({
        name: 'User One',
        email: 'one@example.com',
        password: 'password-one',
      });

      await repository.save({
        name: 'User Two',
        email: 'two@example.com',
        password: 'password-two',
      });

      const users = await repository.findAll();

      expect(users).toHaveLength(2);
      expect(users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'User One',
            email: 'one@example.com',
            password: 'password-one',
          }),
          expect.objectContaining({
            name: 'User Two',
            email: 'two@example.com',
            password: 'password-two',
          }),
        ]),
      );

      expect(users.every((user) => Types.ObjectId.isValid(user.id))).toBe(
        true,
      );
    });

    it('returns an empty array when there are no users', async () => {
      await expect(repository.findAll()).resolves.toEqual([]);
    });
  });

  describe('findById', () => {
    it('finds a user by ID', async () => {
      const createdUser = await repository.save({
        name: 'Santiago',
        email: 'santiago@example.com',
        password: 'hashed-password',
      });

      const user = await repository.findById(createdUser.id);

      expect(user).toEqual(createdUser);
    });

    it('returns null for an invalid ID', async () => {
      await expect(repository.findById('invalid-id')).resolves.toBeNull();
    });

    it('returns null when the user does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      await expect(repository.findById(nonExistentId)).resolves.toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('finds a user by email', async () => {
      const createdUser = await repository.save({
        name: 'Santiago',
        email: 'santiago@example.com',
        password: 'hashed-password',
      });

      const user = await repository.findByEmail('santiago@example.com');

      expect(user).toEqual(createdUser);
    });

    it('returns null when the email does not exist', async () => {
      await expect(
        repository.findByEmail('missing@example.com'),
      ).resolves.toBeNull();
    });

    it('matches the normalized email stored in MongoDB', async () => {
      await repository.save({
        name: 'Santiago',
        email: 'SANTIAGO@EXAMPLE.COM',
        password: 'hashed-password',
      });

      const user = await repository.findByEmail('santiago@example.com');

      expect(user).not.toBeNull();
      expect(user?.email).toBe('santiago@example.com');
    });
  });
});