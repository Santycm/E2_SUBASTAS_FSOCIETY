import { UserRepository } from '../../../../domain/ports/user.repository';
import { PasswordHasher } from '../../../../domain/ports/password-hasher';

import { RegisterUserDto } from './dto/register-user.dto';
import { ApplicationError } from "../../../errors/application-error";

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserDto) {
    const existingUser =
      await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new ApplicationError('EMAIL_ALREADY_EXISTS', 409);
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