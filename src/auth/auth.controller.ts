import { Controller, Body, Post, Get, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { userId: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.name,
      registerDto.password,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: AuthRequest) {
    return this.authService.me(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: AuthRequest) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(token ?? '');
  }
}
