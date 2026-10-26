import { describe, expect, it, jest } from "@jest/globals";
import { RegisterUserUseCase } from "../../../src/application/use-cases/auth/register-user/register-user";
import { User } from "../../../src/domain/entities/user";
import { UserRepository } from "../../../src/domain/ports/user.repository";
import { PasswordHasher } from "../../../src/domain/ports/password-hasher";

describe("RegisterUserUseCase", () => {
  const input = {
    name: "Test User",
    email: "test@example.com",
    password: "plain-password",
  };

  function createUseCase() {
    const userRepository = {
      findByEmail: jest.fn<UserRepository["findByEmail"]>(),
      save: jest.fn<UserRepository["save"]>(),
    };
    const passwordHasher = {
      hash: jest.fn<PasswordHasher["hash"]>(),
    };

    const useCase = new RegisterUserUseCase(
      userRepository as unknown as UserRepository,
      passwordHasher as unknown as PasswordHasher,
    );

    return { useCase, userRepository, passwordHasher };
  }

  it("throws an application error when the email already exists", async () => {
    const { useCase, userRepository, passwordHasher } = createUseCase();

    const existingUser: User = {
      id: "existing-user",
      name: input.name,
      email: input.email,
      password: "existing-hash",
    };
    userRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: "EMAIL_ALREADY_EXISTS",
      statusCode: 409,
    });

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("hashes the password, saves the user and returns public fields", async () => {
    const { useCase, userRepository, passwordHasher } = createUseCase();

    passwordHasher.hash.mockResolvedValue("hashed-password");
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.save.mockResolvedValue({
      id: "user-1",
      name: input.name,
      email: input.email,
      password: "hashed-password",
    });

    const result = await useCase.execute(input);

    expect(passwordHasher.hash).toHaveBeenCalledWith(input.password);
    expect(userRepository.save).toHaveBeenCalledWith({
      name: input.name,
      email: input.email,
      password: "hashed-password",
    });
    expect(result).toEqual({
      id: "user-1",
      name: input.name,
      email: input.email,
    });
    expect(result).not.toHaveProperty("password");
  });
});
