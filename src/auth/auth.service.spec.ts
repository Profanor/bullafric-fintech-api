/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@bullafric-lib/database/prisma.service';
import BcryptUtil from '@bullafric-lib/core/utils/bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TokenHelperService } from '@bullafric-lib/core/utils/token-helper';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let bcryptUtil: BcryptUtil;
  let tokenHelper: TokenHelperService;
  let eventEmitter: EventEmitter2;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    phoneNumber: '08012345678',
    password: 'hashedpass',
    wallets: { balance: 1000, currency: 'NGN' },
  };

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    wallet: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockBcrypt = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockTokenHelper = {
    generateAccessToken: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BcryptUtil, useValue: mockBcrypt },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TokenHelperService, useValue: mockTokenHelper },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    bcryptUtil = module.get<BcryptUtil>(BcryptUtil);
    tokenHelper = module.get<TokenHelperService>(TokenHelperService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should throw if user exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.createUser({
          username: 'testuser',
          email: 'test@example.com',
          phoneNumber: '08012345678',
          password: 'pass',
          acceptTerms: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a new user successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpass');
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        password: 'hashedpass',
      });
      mockPrisma.wallet.create.mockResolvedValue({
        balance: 0,
        currency: 'NGN',
      });

      const result = await service.createUser({
        username: 'newuser',
        email: 'new@example.com',
        phoneNumber: '08099999999',
        password: 'pass',
        acceptTerms: true,
      });

      expect(result).toEqual(expect.objectContaining({ id: mockUser.id }));
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('loginUser', () => {
    it('should throw if user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.loginUser({ email: 'nouser', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw if password does not match', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(
        service.loginUser({ email: 'testuser', password: 'wrongpass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return tokens and user data if credentials are valid', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockTokenHelper.generateAccessToken.mockReturnValue('mockToken');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.loginUser({
        email: 'testuser',
        password: 'pass',
      });

      expect(result).toEqual({
        accessToken: 'mockToken',
        refreshToken: 'mockToken',
        data: mockUser,
      });
      expect(mockTokenHelper.generateAccessToken).toHaveBeenCalledTimes(2);
    });
  });
});
