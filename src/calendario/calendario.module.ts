import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarioService } from './calendario.service';
import { CalendarioController } from './calendario.controller';
import { TipoConsulta } from './entities/tipo-consulta.entity';
import { Consulta } from './entities/consulta.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { ClienteMaster } from '../users/entities/cliente-master.entity';
import { UserComum } from '../users/entities/user-comum.entity';
import { UserBase } from '../users/entities/user-base.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TipoConsulta,
      Consulta,
      Paciente,
      ClienteMaster,
      UserComum,
      UserBase,
    ]),
    UsersModule,
  ],
  controllers: [CalendarioController],
  providers: [CalendarioService],
  exports: [CalendarioService],
})
export class CalendarioModule {}

