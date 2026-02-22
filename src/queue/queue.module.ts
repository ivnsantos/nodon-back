import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { QueueWorkerService } from './queue-worker.service';
import { CalendarioModule } from '../calendario/calendario.module';
import { AssinaturasModule } from '../assinaturas/assinaturas.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    forwardRef(() => CalendarioModule), // Para acessar CalendarioService no worker
    forwardRef(() => AssinaturasModule), // Para acessar AssinaturasService no worker
  ],
  providers: [QueueService, QueueWorkerService],
  exports: [QueueService, QueueWorkerService],
})
export class QueueModule {}

