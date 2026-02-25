import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PastasPacienteController } from './pastas-paciente.controller';
import { PastasPacienteService } from './pastas-paciente.service';
import { PastaPaciente } from './entities/pasta-paciente.entity';
import { ArquivoPasta } from './entities/arquivo-pasta.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PastaPaciente, ArquivoPasta, Paciente]),
    UsersModule,
    ClientesMasterModule,
    StorageModule,
  ],
  controllers: [PastasPacienteController],
  providers: [PastasPacienteService],
  exports: [PastasPacienteService],
})
export class PastasPacienteModule {}
