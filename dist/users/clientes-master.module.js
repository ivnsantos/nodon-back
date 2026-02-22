"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesMasterModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const clientes_master_service_1 = require("./clientes-master.service");
const clientes_master_controller_1 = require("./clientes-master.controller");
const cliente_master_entity_1 = require("./entities/cliente-master.entity");
const user_base_entity_1 = require("./entities/user-base.entity");
const user_comum_entity_1 = require("./entities/user-comum.entity");
const storage_module_1 = require("../storage/storage.module");
const assinaturas_module_1 = require("../assinaturas/assinaturas.module");
const planos_module_1 = require("../planos/planos.module");
const users_module_1 = require("./users.module");
const auth_module_1 = require("../auth/auth.module");
const calendario_module_1 = require("../calendario/calendario.module");
const radiografias_module_1 = require("../radiografias/radiografias.module");
const chat_module_1 = require("../chat/chat.module");
const pacientes_module_1 = require("../pacientes/pacientes.module");
const radiografia_entity_1 = require("../radiografias/entities/radiografia.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
const treatments_module_1 = require("../treatments/treatments.module");
let ClientesMasterModule = class ClientesMasterModule {
};
exports.ClientesMasterModule = ClientesMasterModule;
exports.ClientesMasterModule = ClientesMasterModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([cliente_master_entity_1.ClienteMaster, user_base_entity_1.UserBase, user_comum_entity_1.UserComum, radiografia_entity_1.Radiografia, paciente_entity_1.Paciente]),
            storage_module_1.StorageModule,
            (0, common_1.forwardRef)(() => assinaturas_module_1.AssinaturasModule),
            planos_module_1.PlanosModule,
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            (0, common_1.forwardRef)(() => calendario_module_1.CalendarioModule),
            (0, common_1.forwardRef)(() => radiografias_module_1.RadiografiasModule),
            (0, common_1.forwardRef)(() => chat_module_1.ChatModule),
            (0, common_1.forwardRef)(() => pacientes_module_1.PacientesModule),
            (0, common_1.forwardRef)(() => treatments_module_1.TreatmentsModule),
        ],
        controllers: [clientes_master_controller_1.ClientesMasterController],
        providers: [clientes_master_service_1.ClientesMasterService],
        exports: [clientes_master_service_1.ClientesMasterService],
    })
], ClientesMasterModule);
//# sourceMappingURL=clientes-master.module.js.map