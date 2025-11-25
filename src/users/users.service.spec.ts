/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@bullafric-lib/database/prisma.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { NotFoundException } from '@nestjs/common';
import { TransactionType } from '../../generated/prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let transactionsService: TransactionsService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    phoneNumber: '08012345678',
    createdAt: new Date(),
    wallet: { balance: 1000, currency: 'NGN' },
  };

  const mockTransactions = [
    {
      id: 1,
      createdAt: new Date(),
      amount: 100,
      type: TransactionType.FUND,
      fromUserId: null,
      toUserId: 1,
    },
  ];

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockTransactionsService = {
    getUserTransactions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TransactionsService, useValue: mockTransactionsService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    transactionsService = module.get<TransactionsService>(TransactionsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });

    it('should return user profile if user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(1);
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        createdAt: mockUser.createdAt,
        wallet: {
          balance: mockUser.wallet.balance,
          currency: mockUser.wallet.currency,
        },
      });
    });
  });

  describe('getUserTransactions', () => {
    it('should return transactions from TransactionsService', async () => {
      mockTransactionsService.getUserTransactions.mockResolvedValue(
        mockTransactions,
      );

      const result = await service.getUserTransactions(1);
      expect(result).toEqual(mockTransactions);
      expect(mockTransactionsService.getUserTransactions).toHaveBeenCalledWith(
        1,
      );
    });
  });
});
