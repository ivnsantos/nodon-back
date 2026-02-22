import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesMasterService } from './clientes-master.service';
import { ClientesMasterController } from './clientes-master.controller';
import { ClienteMaster } from './entities/cliente-master.entity';
import { UserBase } from './entities/user-base.entity';
import { UserComum } from './entities/user-comum.entity';
import { StorageModule } from '../storage/storage.module';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';
import { PlanosModule } from '../planos/planos.module';
import { UsersModule } from './users.module';
import { AuthModule } from '../auth/auth.module';
import { CalendarioModule } from '../calendario/calendario.module';
import { RadiografiasModule } from '../radiografias/radiografias.module';
import { ChatModule } from '../chat/chat.module';
import { PacientesModule } from '../pacientes/pacientes.module';
import { Radiografia } from '../radiografias/entities/radiografia.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { TreatmentsModule } from '../treatments/treatments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClienteMaster, UserBase, UserComum, Radiografia, Paciente]),
    StorageModule,
    forwardRef(() => AssinaturasModule),
    PlanosModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    forwardRef(() => CalendarioModule),
    forwardRef(() => RadiografiasModule),
    forwardRef(() => ChatModule),
    forwardRef(() => PacientesModule),
    forwardRef(() => TreatmentsModule),
  ],
  controllers: [ClientesMasterController],
  providers: [ClientesMasterService],
  exports: [ClientesMasterService],
})
export class ClientesMasterModule {}

