import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { getJwtSecret } from 'src/common/config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const token = req.headers.authorization?.split(' ')[1];
    if (this.authService.isTokenInvalid(token)) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
