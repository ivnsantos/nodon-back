import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesenhosProfissionaisService } from './desenhos-profissionais.service';
import { DesenhosProfissionaisController } from './desenhos-profissionais.controller';
import { DesenhoProfissional } from './entities/desenho-profissional.entity';
import { Radiografia } from '../radiografias/entities/radiografia.entity';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { StorageModule } from '../storage/storage.module';
import { NecessidadesModule } from '../necessidades/necessidades.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DesenhoProfissional, Radiografia]),
    UsersModule,
    ClientesMasterModule,
    StorageModule,
    NecessidadesModule,
  ],
  controllers: [DesenhosProfissionaisController],
  providers: [DesenhosProfissionaisService],
  exports: [DesenhosProfissionaisService],
})
export class DesenhosProfissionaisModule {}
