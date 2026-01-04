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
exports.Assinatura = void 0;
const typeorm_1 = require("typeorm");
const cliente_master_entity_1 = require("../../users/entities/cliente-master.entity");
const plano_entity_1 = require("../../planos/entities/plano.entity");
const cupom_entity_1 = require("../../cupons/entities/cupom.entity");
let Assinatura = class Assinatura {
};
exports.Assinatura = Assinatura;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Assinatura.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], Assinatura.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cliente_master_entity_1.ClienteMaster, (clienteMaster) => clienteMaster.assinaturas),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", cliente_master_entity_1.ClienteMaster)
], Assinatura.prototype, "clienteMaster", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asaas_customer_id', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "asaasCustomerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asaas_subscription_id', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "asaasSubscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Assinatura.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Assinatura.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Assinatura.prototype, "cpf", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'postal_code', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "postalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_number', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "addressNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "complement", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "province", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Assinatura.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'billing_type', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "billingType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_card_token', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "creditCardToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'asaas_response', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "asaasResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_id', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "adminId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_card_number', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "creditCardNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_card_brand', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "creditCardBrand", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'coupon_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "couponId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cupom_entity_1.Cupom, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'coupon_id' }),
    __metadata("design:type", cupom_entity_1.Cupom)
], Assinatura.prototype, "cupom", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plano_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Assinatura.prototype, "planoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plano_entity_1.Plano, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'plano_id' }),
    __metadata("design:type", plano_entity_1.Plano)
], Assinatura.prototype, "plano", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Assinatura.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Assinatura.prototype, "updatedAt", void 0);
exports.Assinatura = Assinatura = __decorate([
    (0, typeorm_1.Entity)('subscriptions')
], Assinatura);
//# sourceMappingURL=assinatura.entity.js.map