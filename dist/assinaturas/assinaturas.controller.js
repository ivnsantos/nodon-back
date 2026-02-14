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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssinaturasController = void 0;
const common_1 = require("@nestjs/common");
const assinaturas_service_1 = require("./assinaturas.service");
const create_subscription_dto_1 = require("./dto/create-subscription.dto");
const create_simple_subscription_dto_1 = require("./dto/create-simple-subscription.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const validate_resource_access_guard_1 = require("../auth/guards/validate-resource-access.guard");
const clientes_master_service_1 = require("../users/clientes-master.service");
const user_comum_service_1 = require("../users/services/user-comum.service");
let AssinaturasController = class AssinaturasController {
    assinaturasService;
    clientesMasterService;
    userComumService;
    constructor(assinaturasService, clientesMasterService, userComumService) {
        this.assinaturasService = assinaturasService;
        this.clientesMasterService = clientesMasterService;
        this.userComumService = userComumService;
    }
    async create(createSubscriptionDto) {
        return this.assinaturasService.create(createSubscriptionDto);
    }
    async createSimple(createSimpleSubscriptionDto, req) {
        return this.assinaturasService.createSimple(createSimpleSubscriptionDto, req.user);
    }
    async checkPaymentStatus(userId) {
        return this.assinaturasService.checkFirstPaymentStatus(userId);
    }
    async findMy(req) {
        return this.assinaturasService.findByUserId(req.user.id);
    }
    async getDashboard(req, userComumIdHeader, clienteMasterId, usuario) {
        const userComumId = userComumIdHeader || usuario;
        if (userComumId) {
            const userComum = await this.userComumService.findById(userComumId);
            if (!userComum) {
                throw new common_1.NotFoundException('Usuário não encontrado');
            }
            if (userComum.userId !== req.user.id) {
                throw new common_1.ForbiddenException('Você não tem permissão para acessar este usuário');
            }
            return this.assinaturasService.getDashboardInfoUsuario(userComum.clienteMasterId, userComum);
        }
        if (clienteMasterId) {
            if (req.user.tipo === 'master') {
                const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
                const temVinculo = clientesMaster.some(cm => cm.id === clienteMasterId);
                if (!temVinculo) {
                    throw new common_1.ForbiddenException('Você não tem permissão para acessar este Cliente Master');
                }
            }
            else {
                const usuariosComuns = await this.userComumService.findByUserId(req.user.id);
                const temVinculo = usuariosComuns.some(uc => uc.clienteMasterId === clienteMasterId);
                if (!temVinculo) {
                    throw new common_1.ForbiddenException('Você não tem permissão para acessar este Cliente Master');
                }
            }
            return this.assinaturasService.getDashboardInfo(clienteMasterId, req.user.tipo);
        }
        const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
        if (!clientesMaster || clientesMaster.length === 0) {
            throw new common_1.NotFoundException('Cliente Master não encontrado para este usuário');
        }
        const idClienteMaster = clientesMaster[0].id;
        return this.assinaturasService.getDashboardInfo(idClienteMaster, req.user.tipo);
    }
    async getAnalisesInfo(req, userComumIdHeader, clienteMasterId, usuario) {
        let clienteMasterIdFinal = clienteMasterId;
        const userComumId = userComumIdHeader || usuario;
        if (userComumId) {
            const userComum = await this.userComumService.findById(userComumId);
            if (!userComum) {
                throw new common_1.NotFoundException('Usuário não encontrado');
            }
            if (userComum.userId !== req.user.id) {
                throw new common_1.ForbiddenException('Você não tem permissão para acessar este usuário');
            }
            clienteMasterIdFinal = userComum.clienteMasterId;
        }
        if (clienteMasterIdFinal) {
            if (req.user.tipo === 'master') {
                const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
                const temVinculo = clientesMaster.some(cm => cm.id === clienteMasterIdFinal);
                if (!temVinculo) {
                    throw new common_1.ForbiddenException('Você não tem permissão para acessar este Cliente Master');
                }
            }
            else {
                const usuariosComuns = await this.userComumService.findByUserId(req.user.id);
                const temVinculo = usuariosComuns.some(uc => uc.clienteMasterId === clienteMasterIdFinal);
                if (!temVinculo) {
                    throw new common_1.ForbiddenException('Você não tem permissão para acessar este Cliente Master');
                }
            }
        }
        else {
            const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
            if (!clientesMaster || clientesMaster.length === 0) {
                throw new common_1.NotFoundException('Cliente Master não encontrado para este usuário');
            }
            clienteMasterIdFinal = clientesMaster[0].id;
        }
        return this.assinaturasService.getAnalisesInfo(clienteMasterIdFinal, req.user.id, req.user.tipo);
    }
    async findOne(id) {
        return this.assinaturasService.findById(id);
    }
};
exports.AssinaturasController = AssinaturasController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_dto_1.CreateSubscriptionDto]),
    __metadata("design:returntype", Promise)
], AssinaturasController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('simple'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_simple_subscription_dto_1.CreateSimpleSubscriptionDto, Object]),
    __metadata("design:returntype", Promise)
], AssinaturasController.prototype, "createSimple", null);
__decorate([
    (0, common_1.Get)('check-payment-status/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssinaturasController.prototype, "checkPaymentStatus", null);
__decorate([
    (0, common_1.Get)('minha'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssinaturasController.prototype, "findMy", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, validate_resource_access_guard_1.ValidateResourceAccessGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Headers)('x-user-comum-id')),
    __param(2, (0, common_1.Query)('clienteMasterId')),
    __param(3, (0, common_1.Query)('usuario')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AssinaturasController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('analises'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, validate_resource_access_guard_1.ValidateResourceAccessGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Headers)('x-user-comum-id')),
    __param(2, (0, common_1.Query)('clienteMasterId')),
    __param(3, (0, common_1.Query)('usuario')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AssinaturasController.prototype, "getAnalisesInfo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssinaturasController.prototype, "findOne", null);
exports.AssinaturasController = AssinaturasController = __decorate([
    (0, common_1.Controller)('assinaturas'),
    __metadata("design:paramtypes", [assinaturas_service_1.AssinaturasService,
        clientes_master_service_1.ClientesMasterService,
        user_comum_service_1.UserComumService])
], AssinaturasController);
//# sourceMappingURL=assinaturas.controller.js.map