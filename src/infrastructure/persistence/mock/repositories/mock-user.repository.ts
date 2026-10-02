import { UserRepository } from '../../../../domain/ports/user.repository';
import { User } from '../../../../domain/entities/user';
import { usersData } from '../data/users.data';

export class MockUserRepository implements UserRepository {
  async findAll(): Promise<User[]> {
    return usersData;
  }

  async findById(id: string): Promise<User | null> {
    return usersData.find(user => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return usersData.find(user => user.email === email) ?? null;
  }

  async save(user: User): Promise<User> {
    usersData.push(user);

    return user;
  }
}