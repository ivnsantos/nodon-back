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
exports.User = exports.UserType = void 0;
const typeorm_1 = require("typeorm");
const cliente_master_entity_1 = require("./cliente-master.entity");
var UserType;
(function (UserType) {
    UserType["MASTER"] = "master";
    UserType["ADMIN"] = "admin";
    UserType["USER"] = "usuario";
})(UserType || (exports.UserType = UserType = {}));
let User = class User {
    id;
    nome;
    email;
    password;
    tipo;
    clienteMasterId;
    clienteMaster;
    ativo;
    createdAt;
    updatedAt;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: UserType.USER,
    }),
    __metadata("design:type", String)
], User.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cliente_master_id', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "clienteMasterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cliente_master_entity_1.ClienteMaster, (clienteMaster) => clienteMaster.usuarios, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'cliente_master_id' }),
    __metadata("design:type", cliente_master_entity_1.ClienteMaster)
], User.prototype, "clienteMaster", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "ativo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('usuarios')
], User);
//# sourceMappingURL=user.entity.js.map