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
const dotenv_1 = require("dotenv");
const user_base_entity_1 = require("../users/entities/user-base.entity");
const user_comum_entity_1 = require("../users/entities/user-comum.entity");
const cliente_master_entity_1 = require("../users/entities/cliente-master.entity");
const plano_entity_1 = require("../planos/entities/plano.entity");
const cupom_entity_1 = require("../cupons/entities/cupom.entity");
const assinatura_entity_1 = require("../assinaturas/entities/assinatura.entity");
const historico_mensal_entity_1 = require("../analises/entities/historico-mensal.entity");
const tipo_consulta_entity_1 = require("../calendario/entities/tipo-consulta.entity");
const consulta_entity_1 = require("../calendario/entities/consulta.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
(0, dotenv_1.config)();
let TypeOrmConfigService = class TypeOrmConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    createTypeOrmOptions() {
        const dbHost = this.configService.get('DB_HOST')?.trim();
        const dbPort = this.configService.get('DB_PORT')?.trim();
        const dbUsername = this.configService.get('DB_USERNAME')?.trim();
        const dbPassword = this.configService.get('DB_PASSWORD')?.trim();
        const dbName = this.configService.get('DB_NAME')?.trim();
        const dbSsl = this.configService.get('DB_SSL')?.trim();
        if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbName) {
            console.error('❌ Variáveis de banco de dados faltando ou inválidas:');
            console.error('  - DB_HOST:', dbHost || '❌ FALTANDO');
            console.error('  - DB_PORT:', dbPort || '❌ FALTANDO');
            console.error('  - DB_USERNAME:', dbUsername || '❌ FALTANDO');
            console.error('  - DB_PASSWORD:', dbPassword ? '✅ Configurado' : '❌ FALTANDO');
            console.error('  - DB_NAME:', dbName || '❌ FALTANDO');
            throw new Error('Configurações do banco de dados estão faltando no arquivo .env');
        }
        console.log('✅ Configuração do banco de dados:');
        console.log('  - Host:', dbHost);
        console.log('  - Port:', dbPort);
        console.log('  - Username:', dbUsername);
        console.log('  - Database:', dbName);
        console.log('  - SSL:', dbSsl === 'true' || process.env.VERCEL ? 'Habilitado' : 'Desabilitado');
        const useSsl = true;
        return {
            type: 'postgres',
            host: dbHost,
            port: parseInt(dbPort, 10),
            username: dbUsername,
            password: dbPassword,
            database: dbName,
            ssl: useSsl ? {
                rejectUnauthorized: false,
            } : false,
            entities: [user_base_entity_1.UserBase, user_comum_entity_1.UserComum, cliente_master_entity_1.ClienteMaster, plano_entity_1.Plano, cupom_entity_1.Cupom, assinatura_entity_1.Assinatura, historico_mensal_entity_1.HistoricoMensal, tipo_consulta_entity_1.TipoConsulta, consulta_entity_1.Consulta, paciente_entity_1.Paciente],
            synchronize: process.env.NODE_ENV !== 'production',
            logging: this.configService.get('NODE_ENV') === 'development',
            autoLoadEntities: true,
            extra: useSsl ? {
                ssl: {
                    rejectUnauthorized: false,
                },
            } : {},
        };
    }
};
exports.TypeOrmConfigService = TypeOrmConfigService;
exports.TypeOrmConfigService = TypeOrmConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TypeOrmConfigService);
//# sourceMappingURL=typeorm.config.js.map