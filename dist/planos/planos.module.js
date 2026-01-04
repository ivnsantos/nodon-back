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
exports.PlanosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const planos_service_1 = require("./planos.service");
const planos_controller_1 = require("./planos.controller");
const plano_entity_1 = require("./entities/plano.entity");
let PlanosModule = class PlanosModule {
    constructor(planosService) {
        this.planosService = planosService;
    }
};
exports.PlanosModule = PlanosModule;
exports.PlanosModule = PlanosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([plano_entity_1.Plano])],
        controllers: [planos_controller_1.PlanosController],
        providers: [planos_service_1.PlanosService],
        exports: [planos_service_1.PlanosService],
    }),
    __metadata("design:paramtypes", [planos_service_1.PlanosService])
], PlanosModule);
//# sourceMappingURL=planos.module.js.map