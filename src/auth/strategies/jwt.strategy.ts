import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'NodonDentista@8898GOLdoPalmeiras'),
    });
  }

  async validate(payload: any) {
    if (!payload.id || !payload.email) {
      throw new UnauthorizedException('Token inválido');
    }
    return {
      id: payload.id, // ID do UserBase
      email: payload.email,
      tipo: payload.tipo,
    };
  }
}

