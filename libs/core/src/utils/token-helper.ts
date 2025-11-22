import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenHelperService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generate a JWT access token
   */
  generateAccessToken(payload: any, expiresIn: string | number = '15m') {
    try {
      return this.jwtService.sign(payload, {
        expiresIn: expiresIn as any,
      });
    } catch (error) {
      throw new UnauthorizedException('Failed to generate token', error);
    }
  }

  /**
   * Verify token validity
   */
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token', error);
    }
  }

  /**
   * Decode token (no validation)
   */
  decodeToken(token: string) {
    return this.jwtService.decode(token);
  }
}
