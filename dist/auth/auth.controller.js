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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const clientes_master_service_1 = require("../users/clientes-master.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const is_master_guard_1 = require("./guards/is-master.guard");
let AuthController = class AuthController {
    authService;
    clientesMasterService;
    constructor(authService, clientesMasterService) {
        this.authService = authService;
        this.clientesMasterService = clientesMasterService;
    }
    async login(loginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }
    async registerMaster(registerDto) {
        return this.authService.registerClienteMaster(registerDto);
    }
    async registerUser(registerDto, req) {
        let clienteMasterId = registerDto.clienteMasterId;
        if (!clienteMasterId) {
            const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
            if (!clientesMaster || clientesMaster.length === 0) {
                throw new common_1.NotFoundException('Cliente Master não encontrado para este usuário');
            }
            clienteMasterId = clientesMaster[0].id;
        }
        const registerData = {
            ...registerDto,
            clienteMasterId,
        };
        return this.authService.registerUser(registerData, clienteMasterId);
    }
    async logout(req) {
        return this.authService.logout(req.user);
    }
    async verifyEmail(body) {
        if (!body.email || !body.code) {
            throw new common_1.BadRequestException('E-mail e código são obrigatórios');
        }
        return this.authService.verifyEmail(body.email, body.code);
    }
    async resendVerificationCode(body) {
        if (!body.email) {
            throw new common_1.BadRequestException('E-mail é obrigatório');
        }
        return this.authService.resendVerificationCode(body.email);
    }
    async getClientByToken(req) {
        const userBaseId = req.user.id;
        return this.authService.getClientMasterByUserBaseId(userBaseId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register-master'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerMaster", null);
__decorate([
    (0, common_1.Post)('register-user'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, is_master_guard_1.IsMasterGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerUser", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerificationCode", null);
__decorate([
    (0, common_1.Get)('get-client-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getClientByToken", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        clientes_master_service_1.ClientesMasterService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map