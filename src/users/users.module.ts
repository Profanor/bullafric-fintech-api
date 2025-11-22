import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { DatabaseModule } from '@bullafric-lib/database/database.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, TransactionsModule, DatabaseModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
