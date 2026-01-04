import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalisesService } from './analises.service';
import { AnalisesController } from './analises.controller';
import { HistoricoMensal } from './entities/historico-mensal.entity';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';
import { PlanosModule } from '../planos/planos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoricoMensal]),
    UsersModule,
    ClientesMasterModule,
    AssinaturasModule,
    PlanosModule,
  ],
  controllers: [AnalisesController],
  providers: [AnalisesService],
  exports: [AnalisesService],
})
export class AnalisesModule {}

