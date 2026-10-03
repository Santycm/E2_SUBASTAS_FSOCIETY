import { User } from '../entities/user';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface UserRepository {
  findAll(): Promise<User[]>;

  findById(id: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  save(user: CreateUserData): Promise<User>;
}