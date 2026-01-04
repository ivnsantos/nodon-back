"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalisesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const analises_service_1 = require("./analises.service");
const analises_controller_1 = require("./analises.controller");
const historico_mensal_entity_1 = require("./entities/historico-mensal.entity");
const users_module_1 = require("../users/users.module");
const clientes_master_module_1 = require("../users/clientes-master.module");
const assinaturas_module_1 = require("../assinaturas/assinaturas.module");
const planos_module_1 = require("../planos/planos.module");
let AnalisesModule = class AnalisesModule {
};
exports.AnalisesModule = AnalisesModule;
exports.AnalisesModule = AnalisesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([historico_mensal_entity_1.HistoricoMensal]),
            users_module_1.UsersModule,
            clientes_master_module_1.ClientesMasterModule,
            assinaturas_module_1.AssinaturasModule,
            planos_module_1.PlanosModule,
        ],
        controllers: [analises_controller_1.AnalisesController],
        providers: [analises_service_1.AnalisesService],
        exports: [analises_service_1.AnalisesService],
    })
], AnalisesModule);
//# sourceMappingURL=analises.module.js.map