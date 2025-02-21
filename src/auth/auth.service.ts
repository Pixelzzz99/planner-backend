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

  generateToken(userId: string) {
    const payload = { sub: userId };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async me(userId: string) {
    return this.usersService.getUserById(userId);
  }
}
