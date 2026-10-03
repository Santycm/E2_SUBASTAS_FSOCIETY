import jwt from "jsonwebtoken";

import { TokenService } from "../../domain/ports/token-service";

export class JwtTokenService implements TokenService {
  private readonly secret: string;
  private readonly issuer: string;
  private readonly audience: string;

  constructor() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    this.secret = secret;
    this.issuer = process.env.JWT_ISSUER || "issuer-app";
    this.audience = process.env.JWT_AUDIENCE || "app-audience";
  }

  generate(payload: { userId: string }): string {
    try {
      return jwt.sign(payload, this.secret, {
        algorithm: "HS256",
        expiresIn: (process.env.JWT_EXPIRES_IN ||
          "1h") as jwt.SignOptions["expiresIn"],
        issuer: this.issuer,
        audience: this.audience,
      });
    } catch (error) {
      console.error("[JwtTokenService] Error generating token:", error);

      throw new Error("TOKEN_GENERATION_FAILED");
    }
  }

  verify(token: string): { userId: string } {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: ["HS256"],
        issuer: this.issuer,
        audience: this.audience,
      });

      if (
        typeof payload !== "object" ||
        payload === null ||
        typeof payload.userId !== "string"
      ) {
        throw new Error("INVALID_TOKEN");
      }

      return {
        userId: payload.userId,
      };
    } catch (error) {
      console.error("[JwtTokenService] Error verifying token:", error);

      throw new Error("INVALID_TOKEN");
    }
  }
}
