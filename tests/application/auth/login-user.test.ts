import { describe, expect, it, jest } from '@jest/globals';
import { LoginUserUseCase } from '../../../src/application/use-cases/auth/login-user/login-user';
import { UserRepository } from '../../../src/domain/ports/user.repository';
import { PasswordHasher } from '../../../src/domain/ports/password-hasher';
import { TokenService } from '../../../src/domain/ports/token-service';

describe('LoginUserUseCase', () => {
  const input = {
    email: 'test@example.com',
    password: 'plain-password',
  };

  const user = {
    id: 'user-1',
    name: 'Test User',
    email: input.email,
    password: 'hashed-password',
  };

  function createUseCase() {
    const userRepository = {
      findByEmail: jest.fn(),
    };

    const passwordHasher = {
      compare: jest.fn(),
    };

    const tokenService = {
      generate: jest.fn(),
    };

    const useCase = new LoginUserUseCase(
      userRepository as unknown as UserRepository,
      passwordHasher as unknown as PasswordHasher,
      tokenService as unknown as TokenService,
    );

    return { useCase, userRepository, passwordHasher, tokenService };
  }

  it('returns null when the email is not registered', async () => {
    const { useCase, userRepository, passwordHasher, tokenService } =
      createUseCase();

    userRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute(input);

    expect(result).toBeNull();
    expect(userRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(passwordHasher.compare).not.toHaveBeenCalled();
    expect(tokenService.generate).not.toHaveBeenCalled();
  });

  it('returns null when the password is incorrect', async () => {
    const { useCase, userRepository, passwordHasher, tokenService } =
      createUseCase();

    userRepository.findByEmail.mockResolvedValue(user as never);
    passwordHasher.compare.mockResolvedValue(false);

    const result = await useCase.execute(input);

    expect(result).toBeNull();
    expect(passwordHasher.compare).toHaveBeenCalledWith(
      input.password,
      user.password,
    );
    expect(tokenService.generate).not.toHaveBeenCalled();
  });

  it('returns the user profile and token when credentials are valid', async () => {
    const { useCase, userRepository, passwordHasher, tokenService } =
      createUseCase();

    userRepository.findByEmail.mockResolvedValue(user as never);
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.generate.mockReturnValue('jwt-token');

    const result = await useCase.execute(input);

    expect(tokenService.generate).toHaveBeenCalledWith({
      userId: user.id,
    });
    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      token: 'jwt-token',
    });
  });
});
