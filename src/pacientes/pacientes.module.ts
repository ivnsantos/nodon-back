import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacientesService } from './pacientes.service';
import { PacientesHistoricoService } from './pacientes-historico.service';
import { PacientesController } from './pacientes.controller';
import { Paciente } from './entities/paciente.entity';
import { HistoricoPaciente } from './entities/historico-paciente.entity';
import { Radiografia } from '../radiografias/entities/radiografia.entity';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Paciente, HistoricoPaciente, Radiografia]),
    forwardRef(() => UsersModule),
    forwardRef(() => ClientesMasterModule),
  ],
  controllers: [PacientesController],
  providers: [
    PacientesService,
    PacientesHistoricoService,
  ],
  exports: [PacientesService, PacientesHistoricoService],
})
export class PacientesModule {}
