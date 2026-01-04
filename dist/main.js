"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const dotenv = require('dotenv');
    const path = require('path');
    const fs = require('fs');
    const envPaths = [
        path.join(process.cwd(), 'server-nestjs', '.env'),
        path.join(process.cwd(), '.env'),
        path.join(__dirname, '..', '.env'),
        '.env',
    ];
    console.log('🔍 Procurando arquivo .env...');
    console.log('🔍 process.cwd():', process.cwd());
    console.log('🔍 __dirname:', __dirname);
    let envLoaded = false;
    for (const envPath of envPaths) {
        const fullPath = path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ Arquivo .env encontrado em: ${fullPath}`);
            const result = dotenv.config({ path: fullPath });
            if (result.error) {
                console.error('❌ Erro ao carregar .env:', result.error);
            }
            else {
                envLoaded = true;
                console.log('✅ Variáveis carregadas do .env');
                console.log('🔍 Variáveis encontradas:', Object.keys(result.parsed || {}).join(', '));
                break;
            }
        }
        else {
            console.log(`❌ Arquivo .env não encontrado em: ${fullPath}`);
        }
    }
    if (!envLoaded) {
        console.warn('⚠️ Nenhum arquivo .env encontrado nos caminhos testados');
        dotenv.config();
    }
    console.log('🔍 Verificando variáveis após carregar .env...');
    const asaasKeyBefore = process.env.ASAAS_API_KEY;
    console.log('🔍 process.env.ASAAS_API_KEY:', asaasKeyBefore ? `Encontrado (${asaasKeyBefore.substring(0, 15)}...)` : 'Não encontrado');
    console.log('🔍 process.env.DB_HOST:', process.env.DB_HOST || 'Não encontrado');
    const preservedAsaasKey = process.env.ASAAS_API_KEY;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    if (preservedAsaasKey && (!process.env.ASAAS_API_KEY || process.env.ASAAS_API_KEY !== preservedAsaasKey)) {
        process.env.ASAAS_API_KEY = preservedAsaasKey;
        console.log('✅ ASAAS_API_KEY restaurada após criação do app');
    }
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
    const port = process.env.PORT || 5000;
    await app.listen(port);
    console.log(`🚀 Servidor NestJS rodando na porta ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map