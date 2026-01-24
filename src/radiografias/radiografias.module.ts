import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RadiografiasService } from './radiografias.service';
import { RadiografiasController } from './radiografias.controller';
import { Radiografia } from './entities/radiografia.entity';
import { DesenhoProfissional } from '../desenhos-profissionais/entities/desenho-profissional.entity';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { StorageModule } from '../storage/storage.module';
import { ChatModule } from '../chat/chat.module';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';
import { AnalisesModule } from '../analises/analises.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Radiografia, DesenhoProfissional]),
    UsersModule,
    ClientesMasterModule,
    StorageModule,
    ChatModule,
    AssinaturasModule,
    AnalisesModule,
  ],
  controllers: [RadiografiasController],
  providers: [RadiografiasService],
  exports: [RadiografiasService],
})
export class RadiografiasModule {
  constructor() {
    console.log('✅ RadiografiasModule carregado');
  }
}
