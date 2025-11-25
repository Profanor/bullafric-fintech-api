import { PrismaService } from '@bullafric-lib/database/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from 'generated/prisma/enums';

@Injectable()
export class WalletService {
  constructor(private readonly db: PrismaService) {}

  async getUserWalletBalance(userId: number) {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: {
          wallet: {
            select: {
              balance: true,
              currency: true,
            },
          },
        },
      });
      if (!user || !user.wallet) {
        throw new NotFoundException('User or wallet not found');
      }
      return { balance: user.wallet.balance, currency: user.wallet.currency };
    } catch (error) {
      console.error('An error occured getting your balance', error);
    }
  }

  async fund(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    try {
      const updatedWallet = await this.db.$transaction(async (tx) => {
        const w = await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: amount } },
        });

        await tx.transaction.create({
          data: { amount, type: TransactionType.FUND, toUserId: userId },
        });

        return w;
      });

      return {
        success: {
          balance: updatedWallet.balance,
          currency: updatedWallet.currency,
        },
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Prisma "Record not found"
        throw new NotFoundException('Wallet not found');
      }
      console.error('Error funding wallet', error);
      throw new InternalServerErrorException('Failed to fund wallet');
    }
  }

  async transfer(fromUserId: number, toUserId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (fromUserId === toUserId)
      throw new BadRequestException('You cannot transfer to yourself');

    const result = await this.db.$transaction(async (tx) => {
      const recipient = await tx.user.findUnique({ where: { id: toUserId } });
      if (!recipient) throw new NotFoundException('Recipient user not found');

      // decrement sender balance atomically
      const updatedSender = await tx.wallet.updateMany({
        where: { userId: fromUserId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (updatedSender.count === 0)
        throw new BadRequestException('Insufficient funds or sender not found');

      // increment recipient balance
      const updatedRecipient = await tx.wallet.update({
        where: { userId: toUserId },
        data: { balance: { increment: amount } },
      });

      // create transaction record
      await tx.transaction.create({
        data: {
          amount,
          type: TransactionType.TRANSFER,
          fromUserId,
          toUserId,
        },
      });

      const senderWallet = await tx.wallet.findUnique({
        where: { userId: fromUserId },
      });
      return { senderWallet, recipientWallet: updatedRecipient };
    });

    if (!result || !result.senderWallet || !result.recipientWallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      success: {
        senderBalance: result.senderWallet.balance,
        recipientBalance: result.recipientWallet.balance,
        currency: result.senderWallet.currency,
      },
    };
  }

  async withdraw(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const updatedWallet = await this.db.$transaction(async (tx) => {
      // attempt to decrement only if balance is enough
      const w = await tx.wallet.updateMany({
        where: {
          userId,
          balance: { gte: amount }, // only update if enough balance
        },
        data: {
          balance: { decrement: amount },
        },
      });

      if (w.count === 0) {
        throw new BadRequestException('Insufficient funds');
      }

      await tx.transaction.create({
        data: { amount, type: TransactionType.WITHDRAW, fromUserId: userId },
      });

      // return the latest wallet state
      return tx.wallet.findUnique({ where: { userId } });
    });

    if (!updatedWallet) {
      throw new NotFoundException('wallet not found');
    }

    return {
      success: {
        balance: updatedWallet.balance,
        currency: updatedWallet.currency,
      },
    };
  }
}
