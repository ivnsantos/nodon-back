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
exports.ClientesMasterService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const cliente_master_entity_1 = require("./entities/cliente-master.entity");
const user_base_entity_1 = require("./entities/user-base.entity");
const assinaturas_service_1 = require("../assinaturas/assinaturas.service");
const planos_service_1 = require("../planos/planos.service");
const user_comum_service_1 = require("./services/user-comum.service");
const user_base_service_1 = require("./services/user-base.service");
const calendario_service_1 = require("../calendario/calendario.service");
const radiografias_service_1 = require("../radiografias/radiografias.service");
const chat_service_1 = require("../chat/chat.service");
const pacientes_service_1 = require("../pacientes/pacientes.service");
const radiografia_entity_1 = require("../radiografias/entities/radiografia.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
let ClientesMasterService = class ClientesMasterService {
    clienteMasterRepository;
    userBaseRepository;
    assinaturasService;
    planosService;
    userComumService;
    userBaseService;
    calendarioService;
    radiografiasService;
    chatService;
    pacientesService;
    radiografiaRepository;
    pacienteRepository;
    constructor(clienteMasterRepository, userBaseRepository, assinaturasService, planosService, userComumService, userBaseService, calendarioService, radiografiasService, chatService, pacientesService, radiografiaRepository, pacienteRepository) {
        this.clienteMasterRepository = clienteMasterRepository;
        this.userBaseRepository = userBaseRepository;
        this.assinaturasService = assinaturasService;
        this.planosService = planosService;
        this.userComumService = userComumService;
        this.userBaseService = userBaseService;
        this.calendarioService = calendarioService;
        this.radiografiasService = radiografiasService;
        this.chatService = chatService;
        this.pacientesService = pacientesService;
        this.radiografiaRepository = radiografiaRepository;
        this.pacienteRepository = pacienteRepository;
    }
    async create(data) {
        let hash;
        let hashUnico = false;
        while (!hashUnico) {
            hash = (0, crypto_1.randomUUID)();
            const existe = await this.clienteMasterRepository.findOne({
                where: { hash },
            });
            if (!existe) {
                hashUnico = true;
            }
        }
        const clienteMaster = this.clienteMasterRepository.create({
            userId: data.userId,
            nomeEmpresa: data.nomeEmpresa || 'Empresa',
            cnpj: data.cnpj,
            logo: data.logo,
            cor: data.cor,
            telefoneEmpresa: data.telefoneEmpresa,
            site: data.site,
            descricao: data.descricao,
            outrasInformacoes: data.outrasInformacoes,
            hash: hash,
            ativo: true,
        });
        return this.clienteMasterRepository.save(clienteMaster);
    }
    async findByUserId(userId) {
        return this.clienteMasterRepository.find({
            where: { userId },
            relations: ['user', 'usuarios', 'assinaturas'],
        });
    }
    async findByEmail(email) {
        const userBase = await this.userBaseRepository.findOne({ where: { email } });
        if (!userBase) {
            return null;
        }
        return this.clienteMasterRepository.findOne({
            where: { userId: userBase.id },
            relations: ['user', 'usuarios', 'assinaturas'],
        });
    }
    async findById(id) {
        return this.clienteMasterRepository.findOne({
            where: { id },
            relations: ['user', 'usuarios', 'assinaturas'],
        });
    }
    async findByHash(hash) {
        return this.clienteMasterRepository.findOne({
            where: { hash },
            relations: ['user', 'usuarios', 'assinaturas'],
        });
    }
    async findAll() {
        return this.clienteMasterRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async update(id, data) {
        await this.clienteMasterRepository.update(id, data);
        const clienteMaster = await this.findById(id);
        if (!clienteMaster) {
            throw new Error('Cliente Master não encontrado');
        }
        return clienteMaster;
    }
    async delete(id) {
        await this.clienteMasterRepository.delete(id);
    }
    async getCompleteInfo(clienteMasterId) {
        const clienteMaster = await this.findById(clienteMasterId);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        const userBase = clienteMaster.user;
        if (!userBase) {
            throw new common_1.NotFoundException('Usuário base não encontrado para este Cliente Master');
        }
        const assinatura = await this.assinaturasService.findByUserId(clienteMasterId);
        const usuarios = await this.userComumService.findByClienteMasterId(clienteMasterId);
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
        if (assinatura && assinatura.status === 'PENDING') {
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
                assinatura: {
                    id: assinatura.id,
                    status: assinatura.status,
                },
                plano: null,
                usuarios: usuariosCompletos,
            };
        }
        let plano = null;
        if (assinatura && assinatura.planoId) {
            plano = await this.planosService.findById(assinatura.planoId);
        }
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
            assinatura: assinatura
                ? {
                    id: assinatura.id,
                    userId: assinatura.userId,
                    asaasCustomerId: assinatura.asaasCustomerId,
                    asaasSubscriptionId: assinatura.asaasSubscriptionId,
                    name: assinatura.name,
                    email: assinatura.email,
                    cpf: assinatura.cpf,
                    phone: assinatura.phone,
                    postalCode: assinatura.postalCode,
                    address: assinatura.address,
                    addressNumber: assinatura.addressNumber,
                    complement: assinatura.complement,
                    province: assinatura.province,
                    city: assinatura.city,
                    state: assinatura.state,
                    value: assinatura.value,
                    billingType: assinatura.billingType,
                    status: assinatura.status,
                    planoId: assinatura.planoId,
                    couponId: assinatura.couponId,
                    createdAt: assinatura.createdAt,
                    updatedAt: assinatura.updatedAt,
                }
                : null,
            plano: plano
                ? {
                    id: plano.id,
                    nome: plano.nome,
                    descricao: plano.descricao,
                    valorOriginal: plano.valorOriginal,
                    valorPromocional: plano.valorPromocional,
                    tokenChat: plano.tokenChat,
                    limiteAnalises: plano.limiteAnalises,
                    acesso: plano.acesso,
                    ativo: plano.ativo,
                    createdAt: plano.createdAt,
                    updatedAt: plano.updatedAt,
                }
                : null,
            usuarios: usuariosCompletos,
        };
    }
};
exports.ClientesMasterService = ClientesMasterService;
exports.ClientesMasterService = ClientesMasterService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cliente_master_entity_1.ClienteMaster)),
    __param(1, (0, typeorm_1.InjectRepository)(user_base_entity_1.UserBase)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => assinaturas_service_1.AssinaturasService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_comum_service_1.UserComumService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_base_service_1.UserBaseService))),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => calendario_service_1.CalendarioService))),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => radiografias_service_1.RadiografiasService))),
    __param(8, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __param(9, (0, common_1.Inject)((0, common_1.forwardRef)(() => pacientes_service_1.PacientesService))),
    __param(10, (0, typeorm_1.InjectRepository)(radiografia_entity_1.Radiografia)),
    __param(11, (0, typeorm_1.InjectRepository)(paciente_entity_1.Paciente)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        assinaturas_service_1.AssinaturasService,
        planos_service_1.PlanosService,
        user_comum_service_1.UserComumService,
        user_base_service_1.UserBaseService,
        calendario_service_1.CalendarioService,
        radiografias_service_1.RadiografiasService,
        chat_service_1.ChatService,
        pacientes_service_1.PacientesService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ClientesMasterService);
//# sourceMappingURL=clientes-master.service.js.map