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
exports.ClientesMasterController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const clientes_master_service_1 = require("./clientes-master.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const is_master_guard_1 = require("../auth/guards/is-master.guard");
const update_cliente_master_dto_1 = require("./dto/update-cliente-master.dto");
const storage_service_1 = require("../storage/storage.service");
let ClientesMasterController = class ClientesMasterController {
    clientesMasterService;
    storageService;
    constructor(clientesMasterService, storageService) {
        this.clientesMasterService = clientesMasterService;
        this.storageService = storageService;
    }
    async findAll() {
        return this.clientesMasterService.findAll();
    }
    async findOne(id) {
        return this.clientesMasterService.findById(id);
    }
    async getCompleteInfo(id) {
        return this.clientesMasterService.getCompleteInfo(id);
    }
    async atualizarMeusDados(req, updateDto, file) {
        const userId = req.user.id;
        const userTipo = req.user.tipo;
        let clienteMasterId;
        if (userTipo === 'master') {
            clienteMasterId = userId;
        }
        else {
            throw new common_1.NotFoundException('Apenas Clientes Master podem atualizar dados da empresa');
        }
        const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        if (file) {
            try {
                const path = this.storageService.generateFilePath('logos', file.originalname);
                const logoUrl = await this.storageService.uploadImage(file.buffer, path, file.mimetype);
                updateDto.logo = logoUrl;
            }
            catch (error) {
                console.error('Erro ao fazer upload do logo:', error);
                throw new common_1.BadRequestException(`Erro ao fazer upload da imagem: ${error.message || 'Erro desconhecido'}`);
            }
        }
        const updateData = { ...updateDto };
        if (updateDto.documento && !updateDto.cnpj) {
            updateData.cnpj = updateDto.documento;
            delete updateData.documento;
        }
        else if (updateDto.documento && updateDto.cnpj) {
            delete updateData.documento;
        }
        const updated = await this.clientesMasterService.update(clienteMasterId, updateData);
        return {
            message: 'Dados da empresa atualizados com sucesso',
            clienteMaster: {
                id: updated.id,
                nomeEmpresa: updated.nomeEmpresa,
                cnpj: updated.cnpj,
                logo: updated.logo,
                cor: updated.cor,
                telefoneEmpresa: updated.telefoneEmpresa,
                site: updated.site,
                descricao: updated.descricao,
                outrasInformacoes: updated.outrasInformacoes,
                ativo: updated.ativo,
            },
        };
    }
    async update(id, data) {
        return this.clientesMasterService.update(id, data);
    }
    async delete(id) {
        await this.clientesMasterService.delete(id);
        return { message: 'Cliente master deletado com sucesso' };
    }
};
exports.ClientesMasterController = ClientesMasterController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, is_master_guard_1.IsMasterGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, is_master_guard_1.IsMasterGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "getCompleteInfo", null);
__decorate([
    (0, common_1.Post)('meus-dados'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_cliente_master_dto_1.UpdateClienteMasterDto, Object]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "atualizarMeusDados", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, is_master_guard_1.IsMasterGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, is_master_guard_1.IsMasterGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "delete", null);
exports.ClientesMasterController = ClientesMasterController = __decorate([
    (0, common_1.Controller)('clientes-master'),
    __metadata("design:paramtypes", [clientes_master_service_1.ClientesMasterService,
        storage_service_1.StorageService])
], ClientesMasterController);
//# sourceMappingURL=clientes-master.controller.js.map