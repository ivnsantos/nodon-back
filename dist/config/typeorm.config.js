"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOrmConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const dotenv_1 = require("dotenv");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const user_base_entity_1 = require("../users/entities/user-base.entity");
const user_comum_entity_1 = require("../users/entities/user-comum.entity");
const cliente_master_entity_1 = require("../users/entities/cliente-master.entity");
const plano_entity_1 = require("../planos/entities/plano.entity");
const cupom_entity_1 = require("../cupons/entities/cupom.entity");
const assinatura_entity_1 = require("../assinaturas/entities/assinatura.entity");
const historico_mensal_entity_1 = require("../analises/entities/historico-mensal.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
const historico_paciente_entity_1 = require("../pacientes/entities/historico-paciente.entity");
const radiografia_entity_1 = require("../radiografias/entities/radiografia.entity");
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envLocalPath)) {
    (0, dotenv_1.config)({ path: envLocalPath });
}
else if (fs.existsSync(envPath)) {
    (0, dotenv_1.config)({ path: envPath });
}
else {
    (0, dotenv_1.config)();
}
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
        const isLocal = dbHost === 'localhost' || dbHost === '127.0.0.1';
        const useSsl = dbSsl === 'true' || process.env.VERCEL || (!isLocal && dbSsl !== 'false');
        console.log('  - SSL:', useSsl ? 'Habilitado' : 'Desabilitado');
        console.log('  - Ambiente:', isLocal ? 'Local' : 'Remoto');
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
            entities: [user_base_entity_1.UserBase, user_comum_entity_1.UserComum, cliente_master_entity_1.ClienteMaster, plano_entity_1.Plano, cupom_entity_1.Cupom, assinatura_entity_1.Assinatura, historico_mensal_entity_1.HistoricoMensal, paciente_entity_1.Paciente, historico_paciente_entity_1.HistoricoPaciente, radiografia_entity_1.Radiografia],
            synchronize: false,
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