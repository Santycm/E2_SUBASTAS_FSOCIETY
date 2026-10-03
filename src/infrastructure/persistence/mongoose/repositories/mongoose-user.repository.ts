import { User } from '../../../../domain/entities/user';
import { UserRepository } from '../../../../domain/ports/user.repository';
import { UserModel } from '../models/user.model';

export class MongooseUserRepository implements UserRepository {
  async findAll(): Promise<User[]> {
    const users = await UserModel.find().lean();

    return users.map((user) => this.toDomain(user));
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id).lean();

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email }).lean();

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async save(user: User): Promise<User> {
    const createdUser = await UserModel.create({
      _id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
    });

    return this.toDomain(createdUser.toObject());
  }

  private toDomain(user: {
    _id: unknown;
    name: string;
    email: string;
    password: string;
  }): User {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      password: user.password,
    };
  }
}