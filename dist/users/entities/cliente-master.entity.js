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
exports.ClienteMaster = void 0;
const typeorm_1 = require("typeorm");
const user_base_entity_1 = require("./user-base.entity");
const user_comum_entity_1 = require("./user-comum.entity");
const assinatura_entity_1 = require("../../assinaturas/entities/assinatura.entity");
let ClienteMaster = class ClienteMaster {
    id;
    userId;
    user;
    nomeEmpresa;
    cnpj;
    logo;
    cor;
    telefoneEmpresa;
    site;
    descricao;
    outrasInformacoes;
    valorHora;
    hash;
    ativo;
    createdAt;
    updatedAt;
    usuarios;
    assinaturas;
};
exports.ClienteMaster = ClienteMaster;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClienteMaster.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], ClienteMaster.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_base_entity_1.UserBase, (user) => user.clientesMaster),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_base_entity_1.UserBase)
], ClienteMaster.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nome_empresa', default: 'Empresa' }),
    __metadata("design:type", String)
], ClienteMaster.prototype, "nomeEmpresa", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ClienteMaster.prototype, "cnpj", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ClienteMaster.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ClienteMaster.prototype, "cor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefone_empresa', nullable: true }),
    __metadata("design:type", String)
], ClienteMaster.prototype, "telefoneEmpresa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'site', nullable: true }),
    __metadata("design:type", String)
], ClienteMaster.prototype, "site", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descricao', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ClienteMaster.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'outras_informacoes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ClienteMaster.prototype, "outrasInformacoes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_hora', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ClienteMaster.prototype, "valorHora", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, unique: true, nullable: true }),
    __metadata("design:type", Object)
], ClienteMaster.prototype, "hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ClienteMaster.prototype, "ativo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ClienteMaster.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ClienteMaster.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_comum_entity_1.UserComum, (userComum) => userComum.clienteMaster),
    __metadata("design:type", Array)
], ClienteMaster.prototype, "usuarios", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => assinatura_entity_1.Assinatura, (assinatura) => assinatura.clienteMaster),
    __metadata("design:type", Array)
], ClienteMaster.prototype, "assinaturas", void 0);
exports.ClienteMaster = ClienteMaster = __decorate([
    (0, typeorm_1.Entity)('clientes_master')
], ClienteMaster);
//# sourceMappingURL=cliente-master.entity.js.map