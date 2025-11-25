import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: user with email/username/phone already exists',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async register(@Body() payload: CreateUserDto) {
    return await this.authService.createUser(payload);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Authenticate user and return JWT access token',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginUser(dto);
  }
}
