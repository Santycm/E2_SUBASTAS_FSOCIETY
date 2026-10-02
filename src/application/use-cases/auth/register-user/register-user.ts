import { User } from '../../../../domain/entities/user';
import { UserRepository } from '../../../../domain/ports/user.repository';
import { RegisterUserDto } from './dto/register-user.dto';

export interface RegisterUserResult {
  id: string;
  name: string;
  email: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    dto: RegisterUserDto,
  ): Promise<RegisterUserResult> {
    const users = await this.userRepository.findAll();

    const user: User = {
      id: `user-${String(users.length + 1).padStart(3, '0')}`,
      name: dto.name,
      email: dto.email,
      password: dto.password,
    };

    await this.userRepository.save(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}