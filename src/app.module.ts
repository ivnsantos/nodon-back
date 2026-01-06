import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlanosModule } from './planos/planos.module';
import { CuponsModule } from './cupons/cupons.module';
import { AssinaturasModule } from './assinaturas/assinaturas.module';
import { AnalisesModule } from './analises/analises.module';
import { HealthModule } from './health/health.module';
import { EmailModule } from './email/email.module';
import { StorageModule } from './storage/storage.module';
import { TypeOrmConfigService } from './config/typeorm.config';
import { PlanosService } from './planos/planos.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '.env'),
        join(process.cwd(), '.env'),
        join(process.cwd(), 'server-nestjs', '.env'),
        '.env',
        '../.env',
      ],
      expandVariables: false, // Desabilitado para evitar expansão de $ em ASAAS_API_KEY
      ignoreEnvFile: false,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    AuthModule,
    UsersModule,
    PlanosModule,
    CuponsModule,
    AssinaturasModule,
    AnalisesModule,
    HealthModule,
    EmailModule,
    StorageModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private planosService: PlanosService) {}

  async onModuleInit() {
    // Popular planos na inicialização
    try {
      await this.planosService.seedPlanos();
      console.log('✅ Planos inicializados');
    } catch (error) {
      console.log('ℹ️ Planos já existem ou erro ao inicializar');
    }
  }
}

