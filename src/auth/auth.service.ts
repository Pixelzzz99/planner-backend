import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
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
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const payload = {
      sub: userId,
      email: user.email,
      name: user.name,
    };
    const token = this.jwtService.sign(payload);
    return { accessToken: token };
  }

  async logout(token: string) {
    if (!token) {
      return { message: 'Logged out successfully' };
    }

    const payload = this.jwtService.decode(token) as { exp?: number } | null;
    const expiresAt = payload?.exp
      ? new Date(payload.exp * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const tokenHash = createHash('sha256').update(token).digest('hex');

    await this.prisma.revokedToken.upsert({
      where: { tokenHash },
      create: { tokenHash, expiresAt },
      update: { expiresAt },
    });

    await this.prisma.revokedToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    return { message: 'Logged out successfully' };
  }

  async isTokenInvalid(token: string): Promise<boolean> {
    if (!token) return false;

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const revoked = await this.prisma.revokedToken.findUnique({
      where: { tokenHash },
    });

    return !!revoked && revoked.expiresAt > new Date();
  }

  async me(userId: string) {
    return this.usersService.getUserById(userId);
  }
}
