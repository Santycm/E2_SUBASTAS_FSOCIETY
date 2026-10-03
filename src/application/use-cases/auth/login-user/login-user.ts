import { UserRepository } from '../../../../domain/ports/user.repository';
import { LoginUserDto } from './dto/login-user.dto';

export interface LoginUserResult {
  id: string;
  name: string;
  email: string;
  token: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    dto: LoginUserDto,
  ): Promise<LoginUserResult | null> {
    const user = await this.userRepository.findByEmail(
      dto.email,
    );

    if (!user || user.password !== dto.password) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      token: 'fake-jwt-token',
    };
  }
}