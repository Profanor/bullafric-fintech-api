/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '@bullafric-lib/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock TransactionType enum
jest.mock('generated/prisma/enums', () => ({
  TransactionType: {
    FUND: 'FUND',
    TRANSFER: 'TRANSFER',
    WITHDRAW: 'WITHDRAW',
  },
}));

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
    wallet: { findUnique: jest.fn(), update: jest.fn() },
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
      await expect(service.getUserWalletBalance(1)).resolves.toBeUndefined();
    });

    it('should return wallet balance if found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ wallets: mockWallet });
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

    it('should throw if wallet not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);
      await expect(service.fund(1, 100)).rejects.toThrow(NotFoundException);
    });

    it('should fund wallet successfully', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.wallet.update.mockResolvedValue(mockWallet);
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.fund(1, 500);
      expect(result.success.balance).toEqual(mockWallet.balance);
    });
  });

  describe('transfer', () => {
    it('should throw if fromUserId equals toUserId', async () => {
      await expect(service.transfer(1, 1, 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if insufficient funds', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValueOnce({
        ...mockWallet,
        balance: 50,
      });
      mockPrisma.wallet.findUnique.mockResolvedValueOnce(mockWallet);
      await expect(service.transfer(1, 2, 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should transfer successfully', async () => {
      const sender = { ...mockWallet, balance: 1000 };
      const recipient = { ...mockWallet, balance: 500 };
      mockPrisma.wallet.findUnique
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(recipient);
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.wallet.update.mockResolvedValue(sender);
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.transfer(1, 2, 200);
      expect(result.success.senderBalance).toEqual(sender.balance);
      expect(result.success.recipientBalance).toEqual(sender.balance);
    });
  });

  describe('withdraw', () => {
    it('should throw if insufficient funds', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue({
        ...mockWallet,
        balance: 100,
      });
      await expect(service.withdraw(1, 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should withdraw successfully', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
      mockPrisma.wallet.update.mockResolvedValue(mockWallet);
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.withdraw(1, 100);
      expect(result.success.balance).toEqual(mockWallet.balance);
    });
  });
});
