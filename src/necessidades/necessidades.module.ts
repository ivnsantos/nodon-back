import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Necessidade } from './entities/necessidade.entity';
import { NecessidadesService } from './necessidades.service';
import { NecessidadesController } from './necessidades.controller';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Necessidade]),
    forwardRef(() => ClientesMasterModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [NecessidadesController],
  providers: [NecessidadesService],
  exports: [NecessidadesService],
})
export class NecessidadesModule {}
