import { UserRepository } from '../../../../domain/ports/user.repository';
import { PasswordHasher } from '../../../../domain/ports/password-hasher';

import { RegisterUserDto } from './dto/register-user.dto';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserDto) {
    const existingUser =
      await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const hashedPassword =
      await this.passwordHasher.hash(input.password);

    const user = await this.userRepository.save({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}