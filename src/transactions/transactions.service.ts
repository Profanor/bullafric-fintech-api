import { PrismaService } from '@bullafric-lib/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionsService {
  constructor(private db: PrismaService) {}

  async getUserTransactions(userId: number) {
    return this.db.transaction.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      orderBy: { createdAt: 'desc' },
    });
  }
}
