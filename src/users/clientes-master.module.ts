import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesMasterService } from './clientes-master.service';
import { ClientesMasterController } from './clientes-master.controller';
import { ClienteMaster } from './entities/cliente-master.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClienteMaster])],
  controllers: [ClientesMasterController],
  providers: [ClientesMasterService],
  exports: [ClientesMasterService],
})
export class ClientesMasterModule {}

