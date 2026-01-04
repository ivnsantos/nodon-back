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
exports.HistoricoMensal = void 0;
const typeorm_1 = require("typeorm");
const cliente_master_entity_1 = require("../../users/entities/cliente-master.entity");
let HistoricoMensal = class HistoricoMensal {
    id;
    clienteMasterId;
    clienteMaster;
    ano;
    mes;
    tokensUtilizados;
    analisesFeitas;
    createdAt;
    updatedAt;
};
exports.HistoricoMensal = HistoricoMensal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], HistoricoMensal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cliente_master_id' }),
    __metadata("design:type", String)
], HistoricoMensal.prototype, "clienteMasterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cliente_master_entity_1.ClienteMaster, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'cliente_master_id' }),
    __metadata("design:type", cliente_master_entity_1.ClienteMaster)
], HistoricoMensal.prototype, "clienteMaster", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ano', type: 'int' }),
    __metadata("design:type", Number)
], HistoricoMensal.prototype, "ano", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mes', type: 'int' }),
    __metadata("design:type", Number)
], HistoricoMensal.prototype, "mes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tokens_utilizados', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], HistoricoMensal.prototype, "tokensUtilizados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'analises_feitas', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], HistoricoMensal.prototype, "analisesFeitas", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], HistoricoMensal.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], HistoricoMensal.prototype, "updatedAt", void 0);
exports.HistoricoMensal = HistoricoMensal = __decorate([
    (0, typeorm_1.Entity)('historico_mensal')
], HistoricoMensal);
//# sourceMappingURL=historico-mensal.entity.js.map