export interface TokenService {
  generate(payload: {
    userId: string;
  }): string;

  verify(token: string): {
    userId: string;
  };
}