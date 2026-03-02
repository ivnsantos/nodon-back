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
const fs_1 = require("fs");
const path_1 = require("path");
const user_base_entity_1 = require("../users/entities/user-base.entity");
const user_comum_entity_1 = require("../users/entities/user-comum.entity");
const cliente_master_entity_1 = require("../users/entities/cliente-master.entity");
const plano_entity_1 = require("../planos/entities/plano.entity");
const cupom_entity_1 = require("../cupons/entities/cupom.entity");
const assinatura_entity_1 = require("../assinaturas/entities/assinatura.entity");
const recorrencia_entity_1 = require("../assinaturas/entities/recorrencia.entity");
const historico_mensal_entity_1 = require("../analises/entities/historico-mensal.entity");
const tipo_consulta_entity_1 = require("../calendario/entities/tipo-consulta.entity");
const consulta_entity_1 = require("../calendario/entities/consulta.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
const historico_paciente_entity_1 = require("../pacientes/entities/historico-paciente.entity");
const radiografia_entity_1 = require("../radiografias/entities/radiografia.entity");
const desenho_profissional_entity_1 = require("../desenhos-profissionais/entities/desenho-profissional.entity");
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const pergunta_anamnese_entity_1 = require("../anamneses/entities/pergunta-anamnese.entity");
const resposta_anamnese_entity_1 = require("../anamneses/entities/resposta-anamnese.entity");
const resposta_pergunta_entity_1 = require("../anamneses/entities/resposta-pergunta.entity");
const necessidade_entity_1 = require("../necessidades/entities/necessidade.entity");
const treatment_entity_1 = require("../treatments/entities/treatment.entity");
const treatment_product_entity_1 = require("../treatments/entities/treatment-product.entity");
const product_entity_1 = require("../treatments/entities/product.entity");
const orcamento_entity_1 = require("../orcamentos/entities/orcamento.entity");
const item_orcamento_entity_1 = require("../orcamentos/entities/item-orcamento.entity");
const envLocalPath = (0, path_1.resolve)(process.cwd(), '.env.local');
if ((0, fs_1.existsSync)(envLocalPath)) {
    (0, dotenv_1.config)({ path: envLocalPath });
    console.log('✅ Carregado .env.local');
}
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
        const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1';
        const useSsl = dbSsl === 'true' || (!isLocalhost && process.env.VERCEL);
        console.log('  - SSL:', useSsl ? 'Habilitado' : 'Desabilitado');
        console.log('  - Ambiente:', isLocalhost ? 'Local' : 'Remoto');
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
            entities: [
                user_base_entity_1.UserBase,
                user_comum_entity_1.UserComum,
                cliente_master_entity_1.ClienteMaster,
                plano_entity_1.Plano,
                cupom_entity_1.Cupom,
                assinatura_entity_1.Assinatura,
                recorrencia_entity_1.Recorrencia,
                historico_mensal_entity_1.HistoricoMensal,
                tipo_consulta_entity_1.TipoConsulta,
                consulta_entity_1.Consulta,
                paciente_entity_1.Paciente,
                historico_paciente_entity_1.HistoricoPaciente,
                radiografia_entity_1.Radiografia,
                desenho_profissional_entity_1.DesenhoProfissional,
                anamnese_entity_1.Anamnese,
                pergunta_anamnese_entity_1.PerguntaAnamnese,
                resposta_anamnese_entity_1.RespostaAnamnese,
                resposta_pergunta_entity_1.RespostaPergunta,
                necessidade_entity_1.Necessidade,
                treatment_entity_1.Treatment,
                treatment_product_entity_1.TreatmentProduct,
                product_entity_1.Product,
                orcamento_entity_1.Orcamento,
                item_orcamento_entity_1.ItemOrcamento,
            ],
            synchronize: true,
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