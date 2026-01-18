"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const express = require('express');
let cachedApp;
async function createApp() {
    if (cachedApp) {
        return cachedApp;
    }
    try {
        const expressApp = express();
        expressApp.use(express.json({ limit: '50mb' }));
        expressApp.use(express.urlencoded({ extended: true, limit: '50mb' }));
        const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp));
        app.use((0, cookie_parser_1.default)());
        app.enableCors({
            origin: true,
            credentials: true,
        });
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new common_1.ValidationPipe({
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
                return new common_1.BadRequestException(messages.join('; '));
            },
        }));
        app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
        app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
        const config = new swagger_1.DocumentBuilder()
            .setTitle('NODON Platform API')
            .setDescription('API de autenticação e gerenciamento de usuários')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api', app, document);
        await app.init();
        cachedApp = expressApp;
        return expressApp;
    }
    catch (error) {
        console.error('❌ Erro ao criar aplicação:', error);
        console.error('❌ Stack trace:', error?.stack);
        console.error('❌ Error name:', error?.name);
        console.error('❌ Error message:', error?.message);
        console.error('🔍 Variáveis de ambiente verificadas:');
        console.error('  - DB_HOST:', process.env.DB_HOST ? '✅ Configurado' : '❌ Faltando');
        console.error('  - DB_NAME:', process.env.DB_NAME ? '✅ Configurado' : '❌ Faltando');
        console.error('  - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ Faltando');
        console.error('  - ASAAS_API_KEY:', process.env.ASAAS_API_KEY ? '✅ Configurado' : '❌ Faltando');
        console.error('  - VERCEL:', process.env.VERCEL ? '✅ Detectado' : '❌ Não detectado');
        throw error;
    }
}
async function handler(req, res) {
    try {
        const app = await createApp();
        return app(req, res);
    }
    catch (error) {
        console.error('❌ Erro no handler:', error);
        console.error('❌ Stack trace:', error?.stack);
        console.error('❌ Error name:', error?.name);
        console.error('❌ Error message:', error?.message);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal Server Error',
                message: error?.message || 'Erro desconhecido',
                type: error?.name || 'UnknownError',
                ...(process.env.NODE_ENV !== 'production' && { stack: error?.stack }),
            });
        }
    }
}
async function bootstrap() {
    const app = await createApp();
    const port = process.env.PORT ?? 5000;
    app.listen(port, () => {
        console.log(`Application is running on: http://localhost:${port}`);
        console.log(`Swagger documentation: http://localhost:${port}/api`);
    });
}
if (require.main === module && !process.env.VERCEL) {
    bootstrap();
}
//# sourceMappingURL=main.js.map