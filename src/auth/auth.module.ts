import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';
import { PlanosModule } from '../planos/planos.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UsersModule,
    ClientesMasterModule,
    AssinaturasModule,
    PlanosModule,
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'NodonDentista@8898GOLdoPalmeiras'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, FacebookStrategy],
  exports: [AuthService],
})
export class AuthModule {}

