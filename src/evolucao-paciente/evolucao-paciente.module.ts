import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvolucaoPacienteController } from './evolucao-paciente.controller';
import { EvolucaoPacienteService } from './evolucao-paciente.service';
import { EvolucaoPaciente } from './entities/evolucao-paciente.entity';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EvolucaoPaciente]),
    UsersModule,
    forwardRef(() => ClientesMasterModule),
  ],
  controllers: [EvolucaoPacienteController],
  providers: [EvolucaoPacienteService],
  exports: [EvolucaoPacienteService],
})
export class EvolucaoPacienteModule {}
