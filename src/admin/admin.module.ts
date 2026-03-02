import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtAdminGuard } from './guards/jwt-admin.guard';
import { UserBase } from '../users/entities/user-base.entity';
import { Assinatura } from '../assinaturas/entities/assinatura.entity';
import { Recorrencia } from '../assinaturas/entities/recorrencia.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserBase,
      Assinatura,
      Recorrencia,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, JwtAdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
