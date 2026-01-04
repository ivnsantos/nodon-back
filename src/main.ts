/* eslint-disable */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
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
  } catch (error) {
    console.error('❌ Erro ao criar aplicação:', error);
    throw error;
  }
}

// Handler para Vercel (serverless)
export default async function handler(req: any, res: any) {
  try {
    const app = await createApp();
    return app(req, res);
  } catch (error) {
    console.error('❌ Erro no handler:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error?.message || 'Erro desconhecido',
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
