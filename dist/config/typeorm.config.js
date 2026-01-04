"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path_1 = require("path");
let TypeOrmConfigService = class TypeOrmConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    createTypeOrmOptions() {
        const sslEnabled = this.configService.get('DB_SSL', 'true') === 'true';
        const host = this.configService.get('DB_HOST');
        const database = this.configService.get('DB_NAME');
        const username = this.configService.get('DB_USERNAME');
        if (!host || !database || !username) {
            console.error('❌ Variáveis de banco de dados faltando:');
            console.error('  - DB_HOST:', host || '❌ FALTANDO');
            console.error('  - DB_NAME:', database || '❌ FALTANDO');
            console.error('  - DB_USERNAME:', username || '❌ FALTANDO');
            throw new Error('Variáveis de banco de dados não configuradas. Verifique as variáveis de ambiente no Vercel.');
        }
        console.log('✅ Configuração do banco de dados:');
        console.log('  - Host:', host);
        console.log('  - Database:', database);
        console.log('  - Username:', username);
        console.log('  - SSL:', sslEnabled ? 'Habilitado' : 'Desabilitado');
        return {
            type: 'postgres',
            host,
            port: this.configService.get('DB_PORT', 5432),
            username,
            password: this.configService.get('DB_PASSWORD', ''),
            database,
            entities: [(0, path_1.join)(__dirname, '../**/*.entity{.ts,.js}')],
            synchronize: process.env.NODE_ENV !== 'production',
            logging: process.env.NODE_ENV === 'development',
            autoLoadEntities: true,
            ssl: sslEnabled ? {
                rejectUnauthorized: false,
            } : false,
            extra: {
                sslmode: sslEnabled ? 'require' : 'prefer',
                channel_binding: this.configService.get('PGCHANNELBINDING', 'require'),
            },
            connectTimeoutMS: 10000,
        };
    }
};
exports.TypeOrmConfigService = TypeOrmConfigService;
exports.TypeOrmConfigService = TypeOrmConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TypeOrmConfigService);
//# sourceMappingURL=typeorm.config.js.map