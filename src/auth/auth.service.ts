import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@bullafric-lib/database/prisma.service';
import { IDManager } from '@bullafric-lib/core/managers';
import BcryptUtil from '@bullafric-lib/core/utils/bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { TokenHelperService } from '@bullafric-lib/core/utils/token-helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly bcryptUtil: BcryptUtil,
    private readonly eventEmitter: EventEmitter2,
    private readonly tokenHelperService: TokenHelperService,
  ) {}

  async createUser(payload: CreateUserDto) {
    const { username, email, phoneNumber, password } = payload;

    // check for existing user conflicts
    const existingUser = await this.db.user.findFirst({
      where: { OR: [{ email }, { username }, { phoneNumber }] },
    });

    if (existingUser) {
      const conflicts: string[] = [];
      if (existingUser.email === email) conflicts.push('email');
      if (existingUser.username === username) conflicts.push('username');
      if (existingUser.phoneNumber === phoneNumber)
        conflicts.push('phone number');

      throw new ConflictException(
        `User with ${conflicts.join(', ')} already exists`,
      );
    }

    try {
      const now = new Date();
      const otp = IDManager.generateOTP(5);
      const hashedOtp = await this.bcryptUtil.hash(otp);
      const hashedPassword = await this.bcryptUtil.hash(password);
      const otpExpiryTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 min expiry

      // transaction: create user + wallet
      const result = await this.db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            email,
            phoneNumber,
            password: hashedPassword,
            verificationCode: hashedOtp,
            otpExpiryTime: otpExpiryTime.toISOString(),
          },
          select: { id: true, username: true, email: true, phoneNumber: true },
        });

        await tx.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            currency: 'NGN',
          },
        });

        return user;
      });

      // emit events outside transaction
      this.eventEmitter.emit('user.created', result.id);
      this.eventEmitter.emit('user.send-verification-code', {
        userId: result.id,
        otp,
      });

      return result;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async loginUser(payload: LoginDto) {
    try {
      const { email, password } = payload;

      const userExists = await this.db.user.findFirst({
        where: {
          OR: [{ email }, { phoneNumber: email }, { email: email }],
        },
      });

      if (!userExists) {
        throw new ConflictException('Unable to find that account, try again!.');
      }

      const passwordMatch = await this.bcryptUtil.compare(
        password,
        userExists?.password,
      );

      if (!passwordMatch) throw new BadRequestException('Invalid credentials');

      const sessionId = IDManager.generateId(24);

      const accessToken = this.tokenHelperService.generateAccessToken(
        {
          id: userExists.id,
          sessionId,
        },
        '30d',
      );

      const refreshToken = this.tokenHelperService.generateAccessToken(
        {
          id: userExists?.id,
          sessionId,
        },
        '30d',
      );

      if (!accessToken || !refreshToken) {
        throw new UnauthorizedException(
          'Error authenticating, issue with generating access token',
        );
      }

      const userAccount = await this.db.user.findUnique({
        where: {
          id: userExists.id,
        },
        select: {
          id: true,
          username: true,
          email: true,
          phoneNumber: true,
          wallet: {
            select: { balance: true, currency: true },
          },
        },
      });

      return {
        accessToken,
        refreshToken,
        data: userAccount,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      console.error(error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }
}
