import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnotacoesService } from './anotacoes.service';
import { AnotacoesController } from './anotacoes.controller';
import { Anotacao } from './entities/anotacao.entity';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Anotacao]),
    forwardRef(() => ClientesMasterModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [AnotacoesController],
  providers: [AnotacoesService],
  exports: [AnotacoesService],
})
export class AnotacoesModule {}

