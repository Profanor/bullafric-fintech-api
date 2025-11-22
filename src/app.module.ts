import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from '@bullafric-lib/database/database.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WalletModule } from './wallet/wallet.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [EventEmitterModule.forRoot(), DatabaseModule, AuthModule, WalletModule, TransactionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
