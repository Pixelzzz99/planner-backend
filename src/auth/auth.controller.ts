import { Controller, Body, Post, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  async register(
    @Body() registerDto: { email: string; name: string; password: string },
  ) {
    return this.authService.register(
      registerDto.email,
      registerDto.name,
      registerDto.password,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req) {
    return this.authService.me(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(token);
  }
}
