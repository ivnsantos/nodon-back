import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrcamentosService } from './orcamentos.service';
import { OrcamentosController } from './orcamentos.controller';
import { Orcamento } from './entities/orcamento.entity';
import { ItemOrcamento } from './entities/item-orcamento.entity';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { UsersModule } from '../users/users.module';
import { PacientesModule } from '../pacientes/pacientes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Orcamento, ItemOrcamento]),
    forwardRef(() => ClientesMasterModule),
    forwardRef(() => UsersModule),
    forwardRef(() => PacientesModule),
  ],
  controllers: [OrcamentosController],
  providers: [OrcamentosService],
  exports: [OrcamentosService],
})
export class OrcamentosModule {}

