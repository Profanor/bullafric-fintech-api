/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/only-throw-error */

import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '@bullafric-lib/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;

  const mockWallet = {
    userId: 1,
    balance: 1000,
    currency: 'NGN',
  };

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    wallet: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    transaction: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserWalletBalance', () => {
    it('should throw if user or wallet not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserWalletBalance(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return wallet balance if found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ wallet: mockWallet });
      const result = await service.getUserWalletBalance(1);
      expect(result).toEqual({
        balance: mockWallet.balance,
        currency: mockWallet.currency,
      });
    });
  });

  describe('fund', () => {
    it('should throw if amount is non-positive', async () => {
      await expect(service.fund(1, 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw if wallet not found (simulate Prisma P2025)', async () => {
      mockPrisma.$transaction.mockImplementation(async () => {
        throw { code: 'P2025' };
      });
      await expect(service.fund(1, 100)).rejects.toThrow(NotFoundException);
    });

    it('should fund wallet successfully', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.wallet.update.mockResolvedValue({
        ...mockWallet,
        balance: mockWallet.balance + 500,
        currency: mockWallet.currency,
      });
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.fund(1, 500);
      expect(result.success.balance).toEqual(1500);
      expect(result.success.currency).toEqual('NGN');
    });
  });

  describe('transfer', () => {
    it('should throw if fromUserId equals toUserId', async () => {
      await expect(service.transfer(1, 1, 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if recipient not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.transfer(1, 2, 100)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if insufficient funds', async () => {
      const sender = { ...mockWallet, balance: 50 };
      const recipient = { ...mockWallet, balance: 500 };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.user.findUnique.mockResolvedValue(recipient);
      mockPrisma.wallet.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.transfer(1, 2, 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should transfer successfully', async () => {
      const sender = { ...mockWallet, balance: 1000 };
      const recipient = { ...mockWallet, balance: 500 };

      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.user.findUnique.mockResolvedValue(recipient);
      mockPrisma.wallet.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.wallet.update.mockResolvedValue({
        ...recipient,
        balance: 700,
      });
      mockPrisma.wallet.findUnique.mockResolvedValue({
        ...sender,
        balance: 800,
      });
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.transfer(1, 2, 200);
      expect(result.success.senderBalance).toEqual(800);
      expect(result.success.recipientBalance).toEqual(700);
      expect(result.success.currency).toEqual('NGN');
    });
  });

  describe('withdraw', () => {
    it('should throw if amount is non-positive', async () => {
      await expect(service.withdraw(1, 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw if wallet not found or insufficient funds', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));

      // simulate updateMany returning count = 0 (wallet missing or insufficient funds)
      mockPrisma.wallet.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.withdraw(1, 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should withdraw successfully', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));

      // simulate successful atomic decrement
      mockPrisma.wallet.updateMany.mockResolvedValue({ count: 1 });

      // simulate transaction log
      mockPrisma.transaction.create.mockResolvedValue({});

      // return updated wallet
      mockPrisma.wallet.findUnique.mockResolvedValue({
        userId: 1,
        balance: 800, // 1000 - 200
        currency: 'NGN',
      });

      const result = await service.withdraw(1, 200);

      expect(result.success.balance).toEqual(800);
      expect(result.success.currency).toEqual('NGN');
    });
  });
});
