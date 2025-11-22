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
          wallets: {
            select: {
              balance: true,
              currency: true,
            },
          },
        },
      });
      if (!user || !user.wallets) {
        throw new NotFoundException('User or wallet not found');
      }
      return { balance: user.wallets.balance, currency: user.wallets.currency };
    } catch (error) {
      console.error('An error occured getting your balance', error);
    }
  }

  async fund(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    try {
      const wallet = await this.db.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

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
    } catch (error) {
      console.error('Error funding wallet', error);
      throw new InternalServerErrorException('Failed to fund wallet');
    }
  }

  async transfer(fromUserId: number, toUserId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    if (fromUserId === toUserId)
      throw new BadRequestException('You cannot transfer to yourself');

    try {
      const [sender, recipient] = await Promise.all([
        this.db.wallet.findUnique({ where: { userId: fromUserId } }),
        this.db.wallet.findUnique({ where: { userId: toUserId } }),
      ]);

      if (!sender || !recipient)
        throw new NotFoundException('Sender or recipient wallet not found');

      if (sender.balance < amount)
        throw new BadRequestException('Insufficient funds');

      const result = await this.db.$transaction(async (tx) => {
        const updatedSender = await tx.wallet.update({
          where: { userId: fromUserId },
          data: { balance: { decrement: amount } },
        });

        const updatedRecipient = await tx.wallet.update({
          where: { userId: toUserId },
          data: { balance: { increment: amount } },
        });

        await tx.transaction.create({
          data: {
            amount,
            type: TransactionType.TRANSFER,
            fromUserId,
            toUserId,
          },
        });

        return { updatedSender, updatedRecipient };
      });

      return {
        success: {
          senderBalance: result.updatedSender.balance,
          recipientBalance: result.updatedRecipient.balance,
          currency: result.updatedSender.currency,
        },
      };
    } catch (error) {
      console.error('Error during transfer', error);
      throw new InternalServerErrorException('Failed to transfer funds');
    }
  }

  async withdraw(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    try {
      const wallet = await this.db.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      if (wallet.balance < amount)
        throw new BadRequestException('Insufficient funds');

      const updatedWallet = await this.db.$transaction(async (tx) => {
        const w = await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: amount } },
        });

        await tx.transaction.create({
          data: { amount, type: TransactionType.WITHDRAW, fromUserId: userId },
        });

        return w;
      });

      return {
        success: {
          balance: updatedWallet.balance,
          currency: updatedWallet.currency,
        },
      };
    } catch (error) {
      console.error('Error during withdrawal', error);
      throw new InternalServerErrorException('Failed to withdraw funds');
    }
  }
}
