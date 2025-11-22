import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { DatabaseModule } from '@bullafric-lib/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
