import {
  Get,
  Injectable,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthService {
  private invalidatedTokens: Set<string> = new Set();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, name: string, password: string) {
    if (await this.usersService.getUserByEmail(email)) {
      throw new UnauthorizedException('Email is already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser({
      email,
      name,
      password: hashedPassword,
    });

    return this.generateToken(user.id);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateToken(user.id);
  }

  async generateToken(userId: string) {
    const user = await this.usersService.getUserById(userId);
    const payload = {
      sub: userId,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
    };
    const token = this.jwtService.sign(payload);
    return { accessToken: token };
  }

  async logout(token: string) {
    this.invalidatedTokens.add(token);
    // Очистка старых токенов (older than 24h)
    setTimeout(
      () => {
        this.invalidatedTokens.delete(token);
      },
      24 * 60 * 60 * 1000,
    );
    return { message: 'Logged out successfully' };
  }

  isTokenInvalid(token: string): boolean {
    return this.invalidatedTokens.has(token);
  }

  async me(userId: string) {
    return this.usersService.getUserById(userId);
  }

  async me(userId: string) {
    return this.usersService.getUserById(userId);
  }
}
