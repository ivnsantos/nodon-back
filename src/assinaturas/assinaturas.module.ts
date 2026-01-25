import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssinaturasService } from './assinaturas.service';
import { AssinaturasController } from './assinaturas.controller';
import { Assinatura } from './entities/assinatura.entity';
import { Cupom } from '../cupons/entities/cupom.entity';
import { HistoricoMensal } from '../analises/entities/historico-mensal.entity';
import { PlanosModule } from '../planos/planos.module';
import { CuponsModule } from '../cupons/cupons.module';
import { AsaasService } from './services/asaas.service';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { EmailModule } from '../email/email.module';
import { ChatModule } from '../chat/chat.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assinatura, Cupom, HistoricoMensal]),
    PlanosModule,
    CuponsModule,
    forwardRef(() => UsersModule),
    forwardRef(() => ClientesMasterModule),
    EmailModule,
    forwardRef(() => ChatModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [AssinaturasController],
  providers: [AssinaturasService, AsaasService],
  exports: [AssinaturasService],
})
export class AssinaturasModule {}

