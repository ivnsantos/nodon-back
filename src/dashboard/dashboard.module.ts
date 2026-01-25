import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Radiografia } from '../radiografias/entities/radiografia.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';
import { CalendarioModule } from '../calendario/calendario.module';
import { ChatModule } from '../chat/chat.module';
import { PacientesModule } from '../pacientes/pacientes.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Radiografia, Paciente]),
    forwardRef(() => AssinaturasModule),
    forwardRef(() => CalendarioModule),
    forwardRef(() => ChatModule),
    forwardRef(() => PacientesModule),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ClientesMasterModule),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

