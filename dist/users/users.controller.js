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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const user_comum_service_1 = require("./services/user-comum.service");
const clientes_master_service_1 = require("./clientes-master.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const is_master_guard_1 = require("../auth/guards/is-master.guard");
const validate_resource_access_guard_1 = require("../auth/guards/validate-resource-access.guard");
const user_base_service_1 = require("./services/user-base.service");
let UsersController = class UsersController {
    usersService;
    userComumService;
    clientesMasterService;
    userBaseService;
    constructor(usersService, userComumService, clientesMasterService, userBaseService) {
        this.usersService = usersService;
        this.userComumService = userComumService;
        this.clientesMasterService = clientesMasterService;
        this.userBaseService = userBaseService;
    }
    async findAll(req) {
        const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
        if (!clientesMaster || clientesMaster.length === 0) {
            throw new Error('Cliente Master não encontrado');
        }
        const clienteMasterId = clientesMaster[0].id;
        return this.usersService.findAllByClienteMaster(clienteMasterId);
    }
    async findOne(id, req) {
        const userComum = await this.userComumService.findById(id);
        if (!userComum) {
            throw new Error('Usuário não encontrado');
        }
        if (req.user.tipo === 'master') {
            const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
            if (!clientesMaster || clientesMaster.length === 0) {
                throw new Error('Cliente Master não encontrado');
            }
            const clienteMasterId = clientesMaster[0].id;
            if (userComum.clienteMasterId !== clienteMasterId) {
                throw new Error('Acesso negado');
            }
        }
        return userComum;
    }
    async update(id, data) {
        return this.userComumService.update(id, data);
    }
    async delete(id) {
        await this.userComumService.delete(id);
        return { message: 'Usuário deletado com sucesso' };
    }
    async listarUsuariosComum(clienteMasterIdQuery, clienteMasterIdHeader, req) {
        const clienteMasterId = clienteMasterIdQuery || clienteMasterIdHeader;
        if (!clienteMasterId) {
            return {
                statusCode: 400,
                message: 'Cliente Master ID é obrigatório (query ou header)',
                data: null,
            };
        }
        const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
        if (!clienteMaster) {
            return {
                statusCode: 404,
                message: 'Cliente Master não encontrado',
                data: null,
            };
        }
        const userBaseId = req.user.id;
        const possuiClienteMaster = (await this.clientesMasterService.findByUserId(userBaseId))
            .some(cm => String(cm.id) === String(clienteMasterId));
        if (!possuiClienteMaster) {
            const userComumVinculado = await this.userComumService.findByUserAndClienteMaster(userBaseId, clienteMasterId);
            if (!userComumVinculado) {
                return {
                    statusCode: 403,
                    message: 'Você não tem permissão para acessar este Cliente Master',
                    data: null,
                };
            }
        }
        const usuarios = await this.userComumService.findByClienteMasterId(clienteMasterId);
        const usuariosSimplificados = await Promise.all(usuarios.map(async (usuario) => {
            const userBase = await this.userBaseService.findById(usuario.userId);
            return {
                id: usuario.id,
                nome: userBase?.nome || 'Nome não disponível',
                email: userBase?.email || 'Email não disponível',
            };
        }));
        return {
            statusCode: 200,
            message: 'Usuários Comum listados com sucesso',
            data: {
                cliente_master: {
                    id: clienteMaster.id,
                    nome: clienteMaster.user?.nome || clienteMaster.nomeEmpresa || 'Nome não disponível',
                    email: clienteMaster.user?.email || 'Email não disponível',
                },
                usuarios: usuariosSimplificados,
            },
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(is_master_guard_1.IsMasterGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(is_master_guard_1.IsMasterGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(is_master_guard_1.IsMasterGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('usuarios-comum/listar'),
    (0, common_1.UseGuards)(validate_resource_access_guard_1.ValidateResourceAccessGuard),
    __param(0, (0, common_1.Query)('cliente_master_id')),
    __param(1, (0, common_1.Headers)('x-cliente-master-id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listarUsuariosComum", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        user_comum_service_1.UserComumService,
        clientes_master_service_1.ClientesMasterService,
        user_base_service_1.UserBaseService])
], UsersController);
//# sourceMappingURL=users.controller.js.map