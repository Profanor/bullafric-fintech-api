import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@bullafric-lib/core/utils/user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@User('userId') userId: number) {
    return this.userService.getProfile(userId);
  }

  @ApiOperation({ summary: 'Get user transaction history' })
  @Get('me/transactions')
  async getMyTransactions(@User('userId') userId: number) {
    return this.userService.getUserTransactions(userId);
  }
}
