import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '@bullafric-lib/database/database.module';
import { UserEventsListener } from './user-event-listener';
import { CoreModule } from '@bullafric-lib/core/utils/core.module';

@Module({
  imports: [DatabaseModule, CoreModule],
  providers: [AuthService, UserEventsListener],
  controllers: [AuthController],
})
export class AuthModule {}
