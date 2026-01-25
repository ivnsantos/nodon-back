import { Module, forwardRef } from '@nestjs/common';
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
import { ClientesMasterModule } from '../users/clientes-master.module';
import { AuthModule } from '../auth/auth.module';

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
    forwardRef(() => UsersModule),
    forwardRef(() => ClientesMasterModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [CalendarioController],
  providers: [CalendarioService],
  exports: [CalendarioService],
})
export class CalendarioModule {}

