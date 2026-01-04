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
let ClientesMasterModule = class ClientesMasterModule {
};
exports.ClientesMasterModule = ClientesMasterModule;
exports.ClientesMasterModule = ClientesMasterModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([cliente_master_entity_1.ClienteMaster])],
        controllers: [clientes_master_controller_1.ClientesMasterController],
        providers: [clientes_master_service_1.ClientesMasterService],
        exports: [clientes_master_service_1.ClientesMasterService],
    })
], ClientesMasterModule);
//# sourceMappingURL=clientes-master.module.js.map