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
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal Server Error',
                message: error?.message || 'Erro desconhecido',
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