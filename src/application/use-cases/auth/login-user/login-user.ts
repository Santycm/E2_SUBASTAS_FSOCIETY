import { UserRepository } from '../../../../domain/ports/user.repository';
import { PasswordHasher } from '../../../../domain/ports/password-hasher';
import { TokenService } from '../../../../domain/ports/token-service';

import { LoginUserDto } from './dto/login-user.dto';

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserDto) {
    const user = await this.userRepository.findByEmail(
      input.email,
    );

    if (!user) {
      return null;
    }

    const passwordMatches =
      await this.passwordHasher.compare(
        input.password,
        user.password,
      );

    if (!passwordMatches) {
      return null;
    }

    const token = this.tokenService.generate({
      userId: user.id,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      token,
    };
  }
}