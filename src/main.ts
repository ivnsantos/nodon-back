/* eslint-disable */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

const express = require('express');

let cachedApp: any;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // Criar app Express para Vercel
    const expressApp = express();
    
    // Aumentar limite de tamanho do body para suportar imagens base64 (50MB)
    expressApp.use(express.json({ limit: '50mb' }));
    expressApp.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    // Habilitar cookie parser
    app.use(cookieParser());

    // Habilitar CORS com credenciais
    app.enableCors({
      origin: true, // Em produção, especifique os domínios permitidos
      credentials: true,
    });

    // Prefixo global para todas as rotas
    app.setGlobalPrefix('api');

    // Validação global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
          const messages = errors.map(error => {
            return Object.values(error.constraints || {}).join(', ');
          });
          console.error('❌ Erro de validação:', {
            errors: errors.map(e => ({
              property: e.property,
              constraints: e.constraints,
            })),
            messages,
          });
          return new BadRequestException(messages.join('; '));
        },
      }),
    );

    // Filtro global de exceções
    app.useGlobalFilters(new HttpExceptionFilter());

    // Interceptor global
    app.useGlobalInterceptors(new TransformInterceptor());

    // Swagger
    const config = new DocumentBuilder()
      .setTitle('NODON Platform API')
      .setDescription('API de autenticação e gerenciamento de usuários')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup('api', app as any, document);

    await app.init();
    cachedApp = expressApp;
    return expressApp;
  } catch (error: any) {
    console.error('❌ Erro ao criar aplicação:', error);
    console.error('❌ Stack trace:', error?.stack);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error message:', error?.message);
    
    // Log de variáveis de ambiente (sem valores sensíveis)
    console.error('🔍 Variáveis de ambiente verificadas:');
    console.error('  - DB_HOST:', process.env.DB_HOST ? '✅ Configurado' : '❌ Faltando');
    console.error('  - DB_NAME:', process.env.DB_NAME ? '✅ Configurado' : '❌ Faltando');
    console.error('  - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ Faltando');
    console.error('  - ASAAS_API_KEY:', process.env.ASAAS_API_KEY ? '✅ Configurado' : '❌ Faltando');
    console.error('  - VERCEL:', process.env.VERCEL ? '✅ Detectado' : '❌ Não detectado');
    
    throw error;
  }
}

// Handler para Vercel (serverless)
export default async function handler(req: any, res: any) {
  try {
    const app = await createApp();
    return app(req, res);
  } catch (error: any) {
    console.error('❌ Erro no handler:', error);
    console.error('❌ Stack trace:', error?.stack);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error message:', error?.message);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error?.message || 'Erro desconhecido',
        type: error?.name || 'UnknownError',
        // Em desenvolvimento, incluir stack trace
        ...(process.env.NODE_ENV !== 'production' && { stack: error?.stack }),
      });
    }
  }
}

// Bootstrap para desenvolvimento local
async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT ?? 5000;
  app.listen(port, () => {
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger documentation: http://localhost:${port}/api`);
  });
}

// Executar bootstrap apenas se não estiver no Vercel
if (require.main === module && !process.env.VERCEL) {
  bootstrap();
}
