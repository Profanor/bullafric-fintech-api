import { PrismaService } from '@bullafric-lib/database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        wallets: {
          select: {
            balance: true,
            currency: true,
          },
        },
      },
    });

    if (!user || !user.wallets) throw new NotFoundException('User not found');

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      wallet: {
        balance: user.wallets.balance,
        currency: user.wallets.currency,
      },
    };
  }

  async getUserTransactions(id: number) {
    return this.transactionsService.getUserTransactions(id);
  }
}
