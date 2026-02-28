import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CalendarioService } from './calendario.service';
import { CalendarioController } from './calendario.controller';
import { CalendarioCronService } from './calendario-cron.service';
import { TipoConsulta } from './entities/tipo-consulta.entity';
import { Consulta } from './entities/consulta.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { ClienteMaster } from '../users/entities/cliente-master.entity';
import { UserComum } from '../users/entities/user-comum.entity';
import { UserBase } from '../users/entities/user-base.entity';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { AuthModule } from '../auth/auth.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { QueueModule } from '../queue/queue.module';
import { NecessidadesModule } from '../necessidades/necessidades.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      TipoConsulta,
      Consulta,
      Paciente,
      ClienteMaster,
      UserComum,
      UserBase,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => ClientesMasterModule),
    forwardRef(() => AuthModule),
    WhatsAppModule,
    forwardRef(() => QueueModule),
    NecessidadesModule,
  ],
  controllers: [CalendarioController],
  providers: [CalendarioService, CalendarioCronService],
  exports: [CalendarioService],
})
export class CalendarioModule {}

