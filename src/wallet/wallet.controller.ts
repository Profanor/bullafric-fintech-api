import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { User } from '@bullafric-lib/core/utils/user.decorator';
import { FundDto } from './dto/fund.dto';
import { TransferDto } from './dto/transfer.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get user wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved successfully.',
  })
  async getBalance(@User('userId') userId: number) {
    return this.walletService.getUserWalletBalance(userId);
  }

  @Post('fund')
  @ApiOperation({ summary: 'Fund user wallet from thin air/mock source' })
  async fund(@User('userId') userId: number, @Body() body: FundDto) {
    return this.walletService.fund(userId, body.amount);
  }

  @Post('transfer')
  async transfer(
    @User('userId') fromUserId: number,
    @Body() body: TransferDto,
  ) {
    return this.walletService.transfer(fromUserId, body.toUserId, body.amount);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds from wallet' })
  async withdraw(@User('userId') userId: number, @Body() body: WithdrawDto) {
    return this.walletService.withdraw(userId, body.amount);
  }
}
