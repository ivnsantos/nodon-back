import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssinaturasService } from './assinaturas.service';
import { AssinaturasController } from './assinaturas.controller';
import { Assinatura } from './entities/assinatura.entity';
import { Recorrencia } from './entities/recorrencia.entity';
import { Cobranca } from './entities/cobranca.entity';
import { Cupom } from '../cupons/entities/cupom.entity';
import { HistoricoMensal } from '../analises/entities/historico-mensal.entity';
import { PlanosModule } from '../planos/planos.module';
import { CuponsModule } from '../cupons/cupons.module';
import { PagarMeService } from './services/pagar-me.service';
import { UsersModule } from '../users/users.module';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { ChatModule } from '../chat/chat.module';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assinatura, Recorrencia, Cobranca, Cupom, HistoricoMensal]),
    PlanosModule,
    CuponsModule,
    forwardRef(() => UsersModule),
    forwardRef(() => ClientesMasterModule),
    forwardRef(() => ChatModule),
    forwardRef(() => AuthModule),
    QueueModule,
  ],
  controllers: [AssinaturasController],
  providers: [AssinaturasService, PagarMeService],
  exports: [AssinaturasService],
})
export class AssinaturasModule {}

