"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const validate_resource_access_guard_1 = require("../auth/guards/validate-resource-access.guard");
const update_cliente_master_dto_1 = require("./dto/update-cliente-master.dto");
const storage_service_1 = require("../storage/storage.service");
const user_comum_service_1 = require("./services/user-comum.service");
const register_user_by_hash_dto_1 = require("./dto/register-user-by-hash.dto");
const update_usuario_status_dto_1 = require("./dto/update-usuario-status.dto");
const user_base_service_1 = require("./services/user-base.service");
const auth_service_1 = require("../auth/auth.service");
const assinaturas_service_1 = require("../assinaturas/assinaturas.service");
const bcrypt = __importStar(require("bcryptjs"));
let ClientesMasterController = class ClientesMasterController {
    clientesMasterService;
    storageService;
    userComumService;
    userBaseService;
    authService;
    assinaturasService;
    constructor(clientesMasterService, storageService, userComumService, userBaseService, authService, assinaturasService) {
        this.clientesMasterService = clientesMasterService;
        this.storageService = storageService;
        this.userComumService = userComumService;
        this.userBaseService = userBaseService;
        this.authService = authService;
        this.assinaturasService = assinaturasService;
    }
    async findAll() {
        return this.clientesMasterService.findAll();
    }
    async getClienteMasterByHash(hash) {
        const clienteMaster = await this.clientesMasterService.findByHash(hash);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado com este hash');
        }
        const userBase = clienteMaster.user;
        const assinatura = await this.assinaturasService.findByUserId(clienteMaster.id);
        return {
            clienteMaster: {
                id: clienteMaster.id,
                hash: clienteMaster.hash,
                nomeEmpresa: clienteMaster.nomeEmpresa,
                cnpj: clienteMaster.cnpj,
                logo: clienteMaster.logo,
                cor: clienteMaster.cor,
                telefoneEmpresa: clienteMaster.telefoneEmpresa,
                site: clienteMaster.site,
                descricao: clienteMaster.descricao,
                outrasInformacoes: clienteMaster.outrasInformacoes,
                ativo: clienteMaster.ativo,
                createdAt: clienteMaster.createdAt,
                updatedAt: clienteMaster.updatedAt,
            },
            user: userBase
                ? {
                    id: userBase.id,
                    nome: userBase.nome,
                    email: userBase.email,
                }
                : null,
            assinatura: assinatura
                ? {
                    id: assinatura.id,
                    status: assinatura.status,
                }
                : null,
        };
    }
    async findOne(id) {
        return this.clientesMasterService.findById(id);
    }
    async getCompleteInfo(clienteMasterIdHeader, req) {
        const userBaseId = req.user.id;
        if (!clienteMasterIdHeader) {
            throw new common_1.BadRequestException('Header X-Cliente-Master-Id é obrigatório');
        }
        const id = clienteMasterIdHeader;
        const clienteMaster = await this.clientesMasterService.findById(id);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        const clientesMasterIds = req.user.clientesMasterIds || [];
        const possuiClienteMaster = clientesMasterIds.includes(id);
        let tipoRelacionamento;
        let idRelacionamento;
        let userComumVinculado = null;
        if (possuiClienteMaster) {
            tipoRelacionamento = 'clienteMaster';
            idRelacionamento = clienteMaster.id;
        }
        else {
            const usuariosComunsIds = req.user.usuariosComunsIds || [];
            for (const userComumId of usuariosComunsIds) {
                const userComum = await this.userComumService.findById(userComumId);
                if (userComum && userComum.clienteMasterId === id) {
                    userComumVinculado = userComum;
                    break;
                }
            }
            if (userComumVinculado) {
                tipoRelacionamento = 'usuario';
                idRelacionamento = userComumVinculado.id;
            }
            else {
                throw new common_1.ForbiddenException('Você não tem permissão para acessar este Cliente Master');
            }
        }
        if (tipoRelacionamento === 'usuario') {
            if (!userComumVinculado) {
                throw new common_1.NotFoundException('UserComum não encontrado');
            }
            const assinatura = await this.assinaturasService.findByUserId(id);
            return {
                userComum: {
                    id: userComumVinculado.id,
                    userId: userComumVinculado.userId,
                    clienteMasterId: userComumVinculado.clienteMasterId,
                    ativo: userComumVinculado.ativo,
                    status: userComumVinculado.status,
                    createdAt: userComumVinculado.createdAt,
                    updatedAt: userComumVinculado.updatedAt,
                },
                clienteMasterId: id,
                assinatura: assinatura ? {
                    status: assinatura.status,
                } : null,
                relacionamento: {
                    tipo: tipoRelacionamento,
                    id: idRelacionamento,
                    status: userComumVinculado.status,
                },
            };
        }
        const completeInfo = await this.clientesMasterService.getCompleteInfo(id);
        return {
            ...completeInfo,
            relacionamento: {
                tipo: tipoRelacionamento,
                id: idRelacionamento,
            },
        };
    }
    async atualizarMeusDados(req, updateDto, file) {
        const userBaseId = req.user.id;
        const userTipo = req.user.tipo;
        if (userTipo !== 'master') {
            throw new common_1.NotFoundException('Apenas Clientes Master podem atualizar dados da empresa');
        }
        const clientesMaster = await this.clientesMasterService.findByUserId(userBaseId);
        if (!clientesMaster || clientesMaster.length === 0) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        const clienteMaster = clientesMaster[0];
        const clienteMasterId = clienteMaster.id;
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
    async registerUserByHash(hash, registerDto, authorization) {
        try {
            const clienteMaster = await this.clientesMasterService.findByHash(hash);
            if (!clienteMaster) {
                throw new common_1.NotFoundException('Cliente Master não encontrado com este hash');
            }
            if (!clienteMaster.id) {
                throw new common_1.InternalServerErrorException('Cliente Master encontrado mas sem ID válido');
            }
            console.log('DEBUG - ClienteMaster encontrado pelo hash:', {
                id: clienteMaster.id,
                hash: clienteMaster.hash,
                userId: clienteMaster.userId,
                nomeEmpresa: clienteMaster.nomeEmpresa,
            });
            let userBaseId = null;
            if (authorization) {
                try {
                    const token = authorization.replace('Bearer ', '');
                    const payload = await this.authService.validateToken(token);
                    if (payload && payload.id) {
                        userBaseId = payload.id;
                    }
                }
                catch (error) {
                    userBaseId = null;
                }
            }
            if (registerDto.email) {
                const existingUserBase = await this.userBaseService.findByEmail(registerDto.email);
                if (existingUserBase) {
                    if (!userBaseId) {
                        throw new common_1.UnauthorizedException('Já existe uma conta cadastrada com este e-mail. Por favor, faça login e tente novamente.');
                    }
                    if (userBaseId !== existingUserBase.id) {
                        throw new common_1.ForbiddenException('O token fornecido não corresponde ao e-mail informado. Por favor, faça login com a conta correta.');
                    }
                    userBaseId = existingUserBase.id;
                }
            }
            if (userBaseId) {
                const userComumExistente = await this.userComumService.findByUserAndClienteMaster(userBaseId, clienteMaster.id);
                if (userComumExistente) {
                    throw new common_1.ConflictException('Você já está vinculado a este Cliente Master');
                }
                console.log('DEBUG - Criando UserComum para usuário já logado:', {
                    userBaseId,
                    clienteMasterId: clienteMaster.id,
                    clienteMasterUserId: clienteMaster.userId,
                });
                if (!clienteMaster.id) {
                    throw new common_1.InternalServerErrorException('Cliente Master não possui ID válido');
                }
                const userComum = await this.userComumService.create({
                    userId: userBaseId,
                    clienteMasterId: clienteMaster.id,
                    ativo: registerDto.ativo !== undefined ? registerDto.ativo : true,
                    status: registerDto.status || 'ativo',
                });
                if (!userComum || !userComum.id) {
                    throw new common_1.InternalServerErrorException('Erro ao criar vínculo do usuário com o Cliente Master');
                }
                console.log('DEBUG - UserComum criado com sucesso para usuário logado:', {
                    id: userComum.id,
                    userId: userComum.userId,
                    clienteMasterId: userComum.clienteMasterId,
                    ativo: userComum.ativo,
                    status: userComum.status,
                });
                const userComumCompleto = await this.userComumService.findById(userComum.id);
                if (!userComumCompleto) {
                    throw new common_1.InternalServerErrorException('Erro ao confirmar criação do vínculo do usuário com o Cliente Master');
                }
                const userBaseCompleto = await this.userBaseService.findById(userBaseId);
                return {
                    message: 'Usuário vinculado ao Cliente Master com sucesso',
                    user: userBaseCompleto
                        ? {
                            id: userBaseCompleto.id,
                            nome: userBaseCompleto.nome,
                            email: userBaseCompleto.email,
                            cpf: userBaseCompleto.cpf,
                            telefone: userBaseCompleto.telefone,
                            cro: userBaseCompleto.cro,
                            postalCode: userBaseCompleto.postalCode,
                            address: userBaseCompleto.address,
                            addressNumber: userBaseCompleto.addressNumber,
                            complement: userBaseCompleto.complement,
                            province: userBaseCompleto.province,
                            city: userBaseCompleto.city,
                            state: userBaseCompleto.state,
                            isVerified: userBaseCompleto.isVerified,
                            createdAt: userBaseCompleto.createdAt,
                            updatedAt: userBaseCompleto.updatedAt,
                        }
                        : null,
                    userComum: userComumCompleto
                        ? {
                            id: userComumCompleto.id,
                            userId: userComumCompleto.userId,
                            clienteMasterId: userComumCompleto.clienteMasterId,
                            ativo: userComumCompleto.ativo,
                            status: userComumCompleto.status,
                            createdAt: userComumCompleto.createdAt,
                            updatedAt: userComumCompleto.updatedAt,
                        }
                        : {
                            id: userComum.id,
                            userId: userComum.userId,
                            clienteMasterId: userComum.clienteMasterId,
                            ativo: userComum.ativo,
                            status: userComum.status,
                            createdAt: userComum.createdAt,
                            updatedAt: userComum.updatedAt,
                        },
                };
            }
            if (!registerDto.email || !registerDto.nome || !registerDto.password) {
                throw new common_1.BadRequestException('Para criar uma nova conta, é necessário fornecer: nome, email e password. Ou faça login e tente novamente.');
            }
            const existingUserBase = await this.userBaseService.findByEmail(registerDto.email);
            if (existingUserBase) {
                throw new common_1.UnauthorizedException('Já existe um usuário cadastrado com este e-mail. Por favor, faça login e tente novamente.');
            }
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            const userBase = await this.userBaseService.create({
                nome: registerDto.nome,
                email: registerDto.email,
                password: hashedPassword,
                cpf: registerDto.cpf,
                telefone: registerDto.telefone,
                cro: registerDto.cro,
                postalCode: registerDto.postalCode,
                address: registerDto.address,
                addressNumber: registerDto.addressNumber,
                complement: registerDto.complement,
                province: registerDto.province,
                city: registerDto.city,
                state: registerDto.state,
                isVerified: false,
            });
            if (!userBase || !userBase.id) {
                throw new common_1.InternalServerErrorException('Erro ao criar UserBase');
            }
            console.log('DEBUG - UserBase criado com sucesso - ID:', userBase.id);
            console.log('DEBUG - ClienteMaster ID para vincular:', clienteMaster.id);
            console.log('DEBUG - ClienteMaster userId (dono):', clienteMaster.userId);
            if (!clienteMaster.id) {
                throw new common_1.InternalServerErrorException('Cliente Master não possui ID válido');
            }
            console.log('DEBUG - Criando UserComum com:', {
                userId: userBase.id,
                clienteMasterId: clienteMaster.id,
                ativo: registerDto.ativo !== undefined ? registerDto.ativo : false,
                status: registerDto.status || 'inativo',
            });
            const userComum = await this.userComumService.create({
                userId: userBase.id,
                clienteMasterId: clienteMaster.id,
                ativo: registerDto.ativo !== undefined ? registerDto.ativo : false,
                status: registerDto.status || 'inativo',
            });
            if (!userComum || !userComum.id) {
                throw new common_1.InternalServerErrorException('Erro ao criar vínculo do usuário com o Cliente Master');
            }
            console.log('DEBUG - UserComum criado com sucesso:', {
                id: userComum.id,
                userId: userComum.userId,
                clienteMasterId: userComum.clienteMasterId,
                ativo: userComum.ativo,
                status: userComum.status,
            });
            const userComumCompleto = await this.userComumService.findById(userComum.id);
            if (!userComumCompleto) {
                throw new common_1.InternalServerErrorException('Erro ao confirmar criação do vínculo do usuário com o Cliente Master');
            }
            const token = await this.authService.generateTokenForUser(userBase.id, userBase.email, 'usuario');
            return {
                message: 'Usuário cadastrado e vinculado ao Cliente Master com sucesso',
                access_token: token,
                user: {
                    id: userBase.id,
                    nome: userBase.nome,
                    email: userBase.email,
                    cpf: userBase.cpf,
                    telefone: userBase.telefone,
                    cro: userBase.cro,
                    postalCode: userBase.postalCode,
                    address: userBase.address,
                    addressNumber: userBase.addressNumber,
                    complement: userBase.complement,
                    province: userBase.province,
                    city: userBase.city,
                    state: userBase.state,
                    isVerified: userBase.isVerified,
                    createdAt: userBase.createdAt,
                    updatedAt: userBase.updatedAt,
                },
                userComum: userComumCompleto
                    ? {
                        id: userComumCompleto.id,
                        userId: userComumCompleto.userId,
                        clienteMasterId: userComumCompleto.clienteMasterId,
                        ativo: userComumCompleto.ativo,
                        createdAt: userComumCompleto.createdAt,
                        updatedAt: userComumCompleto.updatedAt,
                    }
                    : {
                        id: userComum.id,
                        userId: userComum.userId,
                        clienteMasterId: userComum.clienteMasterId,
                        ativo: userComum.ativo,
                        createdAt: userComum.createdAt,
                        updatedAt: userComum.updatedAt,
                    },
            };
        }
        catch (error) {
            console.error('Erro em register-by-hash:', error);
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.UnauthorizedException ||
                error instanceof common_1.ForbiddenException ||
                error instanceof common_1.ConflictException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Erro ao processar registro: ${error.message || 'Erro desconhecido'}`);
        }
    }
    async getUsuariosByClienteMaster(id, req) {
        const userBaseId = req.user.id;
        const clienteMaster = await this.clientesMasterService.findById(id);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        const possuiClienteMaster = (await this.clientesMasterService.findByUserId(userBaseId))
            .some(cm => String(cm.id) === String(id));
        if (!possuiClienteMaster) {
            const userComumVinculado = await this.userComumService.findByUserAndClienteMaster(userBaseId, id);
            if (!userComumVinculado) {
                throw new common_1.ForbiddenException('Você não tem permissão para acessar este Cliente Master');
            }
        }
        const usuarios = await this.userComumService.findByClienteMasterId(id);
        const usuariosCompletos = await Promise.all(usuarios.map(async (usuario) => {
            const userBase = await this.userBaseService.findById(usuario.userId);
            return {
                id: usuario.id,
                userId: usuario.userId,
                clienteMasterId: usuario.clienteMasterId,
                ativo: usuario.ativo,
                status: usuario.status,
                createdAt: usuario.createdAt,
                updatedAt: usuario.updatedAt,
                user: userBase
                    ? {
                        id: userBase.id,
                        nome: userBase.nome,
                        email: userBase.email,
                        cpf: userBase.cpf,
                        telefone: userBase.telefone,
                        cro: userBase.cro,
                        postalCode: userBase.postalCode,
                        address: userBase.address,
                        addressNumber: userBase.addressNumber,
                        complement: userBase.complement,
                        province: userBase.province,
                        city: userBase.city,
                        state: userBase.state,
                        isVerified: userBase.isVerified,
                        createdAt: userBase.createdAt,
                        updatedAt: userBase.updatedAt,
                    }
                    : null,
            };
        }));
        return {
            quantidade: usuariosCompletos.length,
            usuarios: usuariosCompletos,
        };
    }
    async updateUsuarioStatus(id, updateDto, req) {
        const userBaseId = req.user.id;
        const userComum = await this.userComumService.findById(id);
        if (!userComum) {
            throw new common_1.NotFoundException('Usuário não encontrado');
        }
        const clienteMaster = await this.clientesMasterService.findById(userComum.clienteMasterId);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        const possuiClienteMaster = (await this.clientesMasterService.findByUserId(userBaseId))
            .some(cm => String(cm.id) === String(userComum.clienteMasterId));
        if (!possuiClienteMaster) {
            throw new common_1.ForbiddenException('Você não tem permissão para alterar o status deste usuário');
        }
        const novoStatus = updateDto.status;
        const novoAtivo = updateDto.ativo !== undefined ? updateDto.ativo : (novoStatus === 'ativo');
        const userComumAtualizado = await this.userComumService.update(id, {
            status: novoStatus,
            ativo: novoAtivo,
        });
        return {
            message: `Usuário ${novoStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso`,
            usuario: {
                id: userComumAtualizado.id,
                userId: userComumAtualizado.userId,
                clienteMasterId: userComumAtualizado.clienteMasterId,
                ativo: userComumAtualizado.ativo,
                status: userComumAtualizado.status,
                createdAt: userComumAtualizado.createdAt,
                updatedAt: userComumAtualizado.updatedAt,
            },
        };
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
    (0, common_1.Get)('hash/:hash'),
    __param(0, (0, common_1.Param)('hash')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "getClienteMasterByHash", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, is_master_guard_1.IsMasterGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, validate_resource_access_guard_1.ValidateResourceAccessGuard),
    __param(0, (0, common_1.Headers)('x-cliente-master-id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
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
__decorate([
    (0, common_1.Post)('register-by-hash/:hash'),
    __param(0, (0, common_1.Param)('hash')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, register_user_by_hash_dto_1.RegisterUserByHashDto, String]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "registerUserByHash", null);
__decorate([
    (0, common_1.Get)(':id/usuarios'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, validate_resource_access_guard_1.ValidateResourceAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "getUsuariosByClienteMaster", null);
__decorate([
    (0, common_1.Patch)('usuarios/:id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_usuario_status_dto_1.UpdateUsuarioStatusDto, Object]),
    __metadata("design:returntype", Promise)
], ClientesMasterController.prototype, "updateUsuarioStatus", null);
exports.ClientesMasterController = ClientesMasterController = __decorate([
    (0, common_1.Controller)('clientes-master'),
    __metadata("design:paramtypes", [clientes_master_service_1.ClientesMasterService,
        storage_service_1.StorageService,
        user_comum_service_1.UserComumService,
        user_base_service_1.UserBaseService,
        auth_service_1.AuthService,
        assinaturas_service_1.AssinaturasService])
], ClientesMasterController);
//# sourceMappingURL=clientes-master.controller.js.map