import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesMasterService } from './clientes-master.service';
import { ClientesMasterController } from './clientes-master.controller';
import { ClienteMaster } from './entities/cliente-master.entity';
import { UserBase } from './entities/user-base.entity';
import { StorageModule } from '../storage/storage.module';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';
import { PlanosModule } from '../planos/planos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClienteMaster, UserBase]),
    StorageModule,
    forwardRef(() => AssinaturasModule),
    PlanosModule,
  ],
  controllers: [ClientesMasterController],
  providers: [ClientesMasterService],
  exports: [ClientesMasterService],
})
export class ClientesMasterModule {}

