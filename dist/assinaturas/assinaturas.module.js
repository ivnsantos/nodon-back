"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssinaturasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const assinaturas_service_1 = require("./assinaturas.service");
const assinaturas_controller_1 = require("./assinaturas.controller");
const assinatura_entity_1 = require("./entities/assinatura.entity");
const recorrencia_entity_1 = require("./entities/recorrencia.entity");
const cobranca_entity_1 = require("./entities/cobranca.entity");
const cupom_entity_1 = require("../cupons/entities/cupom.entity");
const historico_mensal_entity_1 = require("../analises/entities/historico-mensal.entity");
const planos_module_1 = require("../planos/planos.module");
const cupons_module_1 = require("../cupons/cupons.module");
const asaas_service_1 = require("./services/asaas.service");
const users_module_1 = require("../users/users.module");
const clientes_master_module_1 = require("../users/clientes-master.module");
const email_module_1 = require("../email/email.module");
const chat_module_1 = require("../chat/chat.module");
const auth_module_1 = require("../auth/auth.module");
const queue_module_1 = require("../queue/queue.module");
let AssinaturasModule = class AssinaturasModule {
};
exports.AssinaturasModule = AssinaturasModule;
exports.AssinaturasModule = AssinaturasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([assinatura_entity_1.Assinatura, recorrencia_entity_1.Recorrencia, cobranca_entity_1.Cobranca, cupom_entity_1.Cupom, historico_mensal_entity_1.HistoricoMensal]),
            planos_module_1.PlanosModule,
            cupons_module_1.CuponsModule,
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            (0, common_1.forwardRef)(() => clientes_master_module_1.ClientesMasterModule),
            email_module_1.EmailModule,
            (0, common_1.forwardRef)(() => chat_module_1.ChatModule),
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            queue_module_1.QueueModule,
        ],
        controllers: [assinaturas_controller_1.AssinaturasController],
        providers: [assinaturas_service_1.AssinaturasService, asaas_service_1.AsaasService],
        exports: [assinaturas_service_1.AssinaturasService],
    })
], AssinaturasModule);
//# sourceMappingURL=assinaturas.module.js.map