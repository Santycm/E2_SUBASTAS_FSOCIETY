import { Types } from "mongoose";

import { User } from "../../../../domain/entities/user";
import {
  CreateUserData,
  UserRepository,
} from "../../../../domain/ports/user.repository";

import { UserModel } from "../models/user.model";

import { ApplicationError } from "../../../../application/errors/application-error";

export class MongooseUserRepository implements UserRepository {
  async findAll(): Promise<User[]> {
    const users = await UserModel.find().lean();

    return users.map((user) => this.toDomain(user));
  }

  async findById(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const user = await UserModel.findById(id).lean();

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({
      email,
    }).lean();

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async save(userData: CreateUserData): Promise<User> {
    try {
      const createdUser = await UserModel.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

      return this.toDomain(createdUser.toObject());
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new ApplicationError("USER_EMAIL_ALREADY_EXISTS", 409);
      }

      throw error;
    }
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
