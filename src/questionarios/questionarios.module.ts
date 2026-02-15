import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { QuestionariosService } from './questionarios.service';
import { QuestionariosController } from './questionarios.controller';
import { Questionario } from './entities/questionario.entity';
import { PerguntaQuestionario } from './entities/pergunta-questionario.entity';
import { RespostaQuestionario } from './entities/resposta-questionario.entity';
import { RespostaPerguntaQuestionario } from './entities/resposta-pergunta-questionario.entity';
import { ClientesMasterModule } from '../users/clientes-master.module';
import { PacientesModule } from '../pacientes/pacientes.module';
import { UsersModule } from '../users/users.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Questionario,
      PerguntaQuestionario,
      RespostaQuestionario,
      RespostaPerguntaQuestionario,
    ]),
    ConfigModule,
    forwardRef(() => ClientesMasterModule),
    forwardRef(() => PacientesModule),
    forwardRef(() => UsersModule),
    WhatsAppModule,
  ],
  controllers: [QuestionariosController],
  providers: [QuestionariosService],
  exports: [QuestionariosService],
})
export class QuestionariosModule {}

