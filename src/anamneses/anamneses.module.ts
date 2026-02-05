import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnamnesesService } from './anamneses.service';
import { AnamnesesController } from './anamneses.controller';
import { Anamnese } from './entities/anamnese.entity';
import { PerguntaAnamnese } from './entities/pergunta-anamnese.entity';
import { RespostaAnamnese } from './entities/resposta-anamnese.entity';
import { RespostaPergunta } from './entities/resposta-pergunta.entity';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { PacientesModule } from '../pacientes/pacientes.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Anamnese, PerguntaAnamnese, RespostaAnamnese, RespostaPergunta]),
    forwardRef(() => ClientesMasterModule),
    forwardRef(() => PacientesModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [AnamnesesController],
  providers: [AnamnesesService],
  exports: [AnamnesesService],
})
export class AnamnesesModule {}

