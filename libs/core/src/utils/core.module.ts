import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { envVariables } from '../config/env';
import BcryptUtil from './bcrypt';
import { TokenHelperService } from './token-helper';

@Module({
  imports: [
    JwtModule.register({
      secret: envVariables.JWT.JWTSecret,
      signOptions: { expiresIn: envVariables.JWT.JWTExpires as any },
    }),
  ],
  providers: [BcryptUtil, TokenHelperService],
  exports: [BcryptUtil, TokenHelperService],
})
export class CoreModule {}
