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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const path_1 = require("path");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const planos_module_1 = require("./planos/planos.module");
const cupons_module_1 = require("./cupons/cupons.module");
const assinaturas_module_1 = require("./assinaturas/assinaturas.module");
const analises_module_1 = require("./analises/analises.module");
const health_module_1 = require("./health/health.module");
const email_module_1 = require("./email/email.module");
const storage_module_1 = require("./storage/storage.module");
const chat_module_1 = require("./chat/chat.module");
const pacientes_module_1 = require("./pacientes/pacientes.module");
const radiografias_module_1 = require("./radiografias/radiografias.module");
const desenhos_profissionais_module_1 = require("./desenhos-profissionais/desenhos-profissionais.module");
const typeorm_config_1 = require("./config/typeorm.config");
const planos_service_1 = require("./planos/planos.service");
let AppModule = class AppModule {
    planosService;
    constructor(planosService) {
        this.planosService = planosService;
    }
    async onModuleInit() {
        try {
            await this.planosService.seedPlanos();
            console.log('✅ Planos inicializados');
        }
        catch (error) {
            console.log('ℹ️ Planos já existem ou erro ao inicializar');
        }
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    (0, path_1.join)(__dirname, '..', '.env'),
                    (0, path_1.join)(process.cwd(), '.env'),
                    (0, path_1.join)(process.cwd(), 'server-nestjs', '.env'),
                    '.env',
                    '../.env',
                ],
                expandVariables: false,
                ignoreEnvFile: false,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useClass: typeorm_config_1.TypeOrmConfigService,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            planos_module_1.PlanosModule,
            cupons_module_1.CuponsModule,
            assinaturas_module_1.AssinaturasModule,
            analises_module_1.AnalisesModule,
            health_module_1.HealthModule,
            email_module_1.EmailModule,
            storage_module_1.StorageModule,
            chat_module_1.ChatModule,
            pacientes_module_1.PacientesModule,
            radiografias_module_1.RadiografiasModule,
            desenhos_profissionais_module_1.DesenhosProfissionaisModule,
        ],
    }),
    __metadata("design:paramtypes", [planos_service_1.PlanosService])
], AppModule);
//# sourceMappingURL=app.module.js.map