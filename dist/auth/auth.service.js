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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const users_service_1 = require("../users/users.service");
const user_base_service_1 = require("../users/services/user-base.service");
const user_comum_service_1 = require("../users/services/user-comum.service");
const clientes_master_service_1 = require("../users/clientes-master.service");
const assinaturas_service_1 = require("../assinaturas/assinaturas.service");
const planos_service_1 = require("../planos/planos.service");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    usersService;
    userBaseService;
    userComumService;
    clientesMasterService;
    assinaturasService;
    planosService;
    jwtService;
    emailService;
    constructor(usersService, userBaseService, userComumService, clientesMasterService, assinaturasService, planosService, jwtService, emailService) {
        this.usersService = usersService;
        this.userBaseService = userBaseService;
        this.userComumService = userComumService;
        this.clientesMasterService = clientesMasterService;
        this.assinaturasService = assinaturasService;
        this.planosService = planosService;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async validateUser(email, password) {
        const userBase = await this.userBaseService.findByEmail(email);
        if (!userBase) {
            return null;
        }
        const isPasswordValid = await bcrypt.compare(password, userBase.password);
        if (!isPasswordValid) {
            return null;
        }
        const clienteMaster = await this.clientesMasterService.findByEmail(email);
        if (clienteMaster && clienteMaster.ativo) {
            return {
                id: clienteMaster.id,
                userId: userBase.id,
                nome: userBase.nome,
                email: userBase.email,
                tipo: 'master',
                clienteMasterId: clienteMaster.id,
            };
        }
        const usuariosComuns = await this.userComumService.findByUserId(userBase.id);
        if (usuariosComuns && usuariosComuns.length > 0) {
            const userComum = usuariosComuns[0];
            return {
                id: userComum.id,
                userId: userBase.id,
                nome: userBase.nome,
                email: userBase.email,
                tipo: 'usuario',
                clienteMasterId: userComum.clienteMasterId,
            };
        }
        return {
            id: userBase.id,
            userId: userBase.id,
            nome: userBase.nome,
            email: userBase.email,
            tipo: 'usuario',
            clienteMasterId: null,
        };
    }
    async login(email, password) {
        const user = await this.validateUser(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const tipo = user.tipo || 'usuario';
        const isAdmin = tipo === 'master';
        const userBase = await this.userBaseService.findByEmail(user.email);
        const isEmailVerified = userBase?.isVerified || false;
        let assinatura = null;
        let planoInfo = null;
        if (tipo === 'master') {
            assinatura = await this.assinaturasService.findByUserId(user.id);
        }
        else if (user.clienteMasterId) {
            assinatura = await this.assinaturasService.findByUserId(user.clienteMasterId);
        }
        if (assinatura && assinatura.planoId) {
            const plano = await this.planosService.findById(assinatura.planoId);
            if (plano) {
                planoInfo = {
                    id: plano.id,
                    nome: plano.nome,
                    valorOriginal: Number(plano.valorOriginal),
                    valorPromocional: plano.valorPromocional ? Number(plano.valorPromocional) : null,
                    limiteAnalises: plano.limiteAnalises,
                    tokenChat: Number(plano.tokenChat),
                    descricao: plano.descricao,
                };
            }
        }
        const clientesMaster = await this.clientesMasterService.findByUserId(user.userId);
        const clientesMasterIds = clientesMaster.map(cm => cm.id);
        const usuariosComuns = await this.userComumService.findByUserId(user.userId);
        const usuariosComunsIds = usuariosComuns.map(uc => uc.id);
        const payload = {
            id: user.userId,
            email: user.email,
            tipo: tipo,
            clientesMasterIds: clientesMasterIds,
            usuariosComunsIds: usuariosComunsIds,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                tipo: tipo,
                isAdmin: isAdmin,
                isEmailVerified: isEmailVerified,
                assinatura: assinatura
                    ? {
                        id: assinatura.id,
                        status: assinatura.status,
                        planoId: assinatura.planoId,
                        plano: planoInfo,
                    }
                    : null,
            },
        };
    }
    async registerClienteMaster(data) {
        const existingUserBase = await this.userBaseService.findByEmail(data.email);
        if (existingUserBase) {
            throw new common_1.ConflictException('Já existe um usuário cadastrado com este e-mail');
        }
        const existingClienteMaster = await this.clientesMasterService.findByEmail(data.email);
        let emailJaVerificado = false;
        if (existingClienteMaster) {
            const userBaseDoCliente = await this.userBaseService.findById(existingClienteMaster.userId);
            emailJaVerificado = userBaseDoCliente?.isVerified || false;
        }
        let verificationToken = null;
        let tokenExpiresAt = null;
        let isVerified = false;
        if (emailJaVerificado) {
            isVerified = true;
        }
        else {
            verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
            tokenExpiresAt = new Date();
            tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const userBase = await this.userBaseService.create({
            nome: data.nome,
            email: data.email,
            password: hashedPassword,
            telefone: data.telefone,
            isVerified,
            verificationToken,
            tokenExpiresAt,
        });
        const clienteMaster = await this.clientesMasterService.create({
            userId: userBase.id,
            cnpj: data.cnpj,
        });
        if (!isVerified && verificationToken) {
            try {
                await this.emailService.sendVerificationCode(userBase.email, verificationToken, userBase.nome);
            }
            catch (error) {
                console.error('Erro ao enviar email de verificação:', error);
            }
        }
        return {
            message: isVerified
                ? 'Cadastro realizado com sucesso! Seu e-mail já estava verificado em outra conta.'
                : 'Cadastro realizado com sucesso! Por favor, verifique seu e-mail para ativar sua conta.',
            user: {
                id: clienteMaster.id,
                userId: userBase.id,
                nome: userBase.nome,
                email: userBase.email,
                tipo: 'master',
                isVerified,
            },
        };
    }
    async registerUser(data, clienteMasterId) {
        const existingUserBase = await this.userBaseService.findByEmail(data.email);
        if (existingUserBase) {
            throw new common_1.ConflictException('Já existe um usuário cadastrado com este e-mail');
        }
        const existingClienteMaster = await this.clientesMasterService.findByEmail(data.email);
        let emailJaVerificado = false;
        if (existingClienteMaster) {
            const userBaseDoCliente = await this.userBaseService.findById(existingClienteMaster.userId);
            emailJaVerificado = userBaseDoCliente?.isVerified || false;
        }
        let verificationToken = null;
        let tokenExpiresAt = null;
        let isVerified = false;
        if (emailJaVerificado) {
            isVerified = true;
        }
        else {
            verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
            tokenExpiresAt = new Date();
            tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const userBase = await this.userBaseService.create({
            nome: data.nome,
            email: data.email,
            password: hashedPassword,
            isVerified,
            verificationToken,
            tokenExpiresAt,
        });
        const userComum = await this.userComumService.create({
            userId: userBase.id,
            clienteMasterId,
            ativo: true,
            status: 'ativo',
        });
        if (!isVerified && verificationToken) {
            try {
                await this.emailService.sendVerificationCode(userBase.email, verificationToken, userBase.nome);
            }
            catch (error) {
                console.error('Erro ao enviar email de verificação:', error);
            }
        }
        return {
            message: isVerified
                ? 'Usuário cadastrado com sucesso! Seu e-mail já estava verificado em outra conta.'
                : 'Usuário cadastrado com sucesso! Por favor, verifique seu e-mail para ativar sua conta.',
            user: {
                id: userBase.id,
                nome: userBase.nome,
                email: userBase.email,
                tipo: 'usuario',
                clienteMasterId: userComum.clienteMasterId,
                isVerified,
            },
        };
    }
    async logout(user) {
        return {
            message: 'Logout realizado com sucesso',
            userId: user.id,
        };
    }
    async validateToken(token) {
        try {
            return this.jwtService.verify(token);
        }
        catch (error) {
            return null;
        }
    }
    async generateTokenForUser(userId, email, tipo) {
        const payload = {
            id: userId,
            email: email,
            tipo: tipo,
        };
        return this.jwtService.sign(payload);
    }
    async verifyEmail(email, code) {
        const userBase = await this.userBaseService.findByEmail(email);
        if (!userBase) {
            throw new common_1.BadRequestException('E-mail não encontrado.');
        }
        if (userBase.verificationToken !== code) {
            throw new common_1.BadRequestException('Código de verificação inválido.');
        }
        if (userBase.tokenExpiresAt && new Date() > userBase.tokenExpiresAt) {
            throw new common_1.BadRequestException('Código de verificação expirado. Por favor, solicite um novo.');
        }
        await this.userBaseService.updateVerificationStatus(userBase.id, true);
        return { message: 'E-mail verificado com sucesso!' };
    }
    async resendVerificationCode(email) {
        const userBase = await this.userBaseService.findByEmail(email);
        if (!userBase) {
            throw new common_1.BadRequestException('E-mail não encontrado.');
        }
        if (userBase.isVerified) {
            throw new common_1.BadRequestException('Este e-mail já foi verificado.');
        }
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
        await this.userBaseService.update(userBase.id, {
            verificationToken,
            tokenExpiresAt,
        });
        try {
            await this.emailService.sendVerificationCode(userBase.email, verificationToken, userBase.nome);
            return { message: 'Código de verificação reenviado com sucesso!' };
        }
        catch (error) {
            console.error('Erro ao enviar email de verificação:', error);
            return {
                message: 'Código de verificação gerado. Verifique a configuração de email para envio automático.',
                code: verificationToken,
                warning: 'Email não foi enviado devido a erro de configuração SMTP'
            };
        }
    }
    async getClientMasterByUserBaseId(userBaseId) {
        const clientesMasterAssociados = [];
        console.log('DEBUG - Buscando UserBase com ID:', userBaseId);
        let userBase = await this.userBaseService.findById(userBaseId);
        if (!userBase) {
            console.log('DEBUG - UserBase não encontrado, tentando buscar UserComum com userId:', userBaseId);
            const usuariosComuns = await this.userComumService.findByUserId(userBaseId);
            if (usuariosComuns && usuariosComuns.length > 0 && usuariosComuns[0].user) {
                userBase = usuariosComuns[0].user;
                console.log('DEBUG - UserBase encontrado através do UserComum:', userBase.id);
            }
            else {
                throw new common_1.BadRequestException('Nenhum usuário encontrado para este ID.');
            }
        }
        const clientesMasterComoDono = await this.clientesMasterService.findByUserId(userBase.id);
        if (clientesMasterComoDono && clientesMasterComoDono.length > 0) {
            for (const clienteMaster of clientesMasterComoDono) {
                let clienteMasterCompleto = clienteMaster;
                if (!clienteMaster.user) {
                    const clienteMasterComRelacoes = await this.clientesMasterService.findById(clienteMaster.id);
                    if (!clienteMasterComRelacoes || !clienteMasterComRelacoes.user) {
                        continue;
                    }
                    clienteMasterCompleto = clienteMasterComRelacoes;
                }
                const assinatura = await this.assinaturasService.findByUserId(clienteMasterCompleto.id);
                let planoInfo = undefined;
                if (assinatura && assinatura.planoId) {
                    const plano = await this.planosService.findById(assinatura.planoId);
                    if (plano) {
                        planoInfo = {
                            id: plano.id,
                            nome: plano.nome,
                            valor: plano.valorPromocional || plano.valorOriginal,
                            tokenChat: plano.tokenChat,
                            analises: plano.limiteAnalises,
                        };
                    }
                }
                clientesMasterAssociados.push({
                    id: clienteMasterCompleto.id,
                    hash: clienteMasterCompleto.hash,
                    nome: clienteMasterCompleto.user.nome,
                    email: clienteMasterCompleto.user.email,
                    telefone: clienteMasterCompleto.user.telefone,
                    cnpj: clienteMasterCompleto.cnpj,
                    ativo: clienteMasterCompleto.ativo,
                    isVerified: clienteMasterCompleto.user.isVerified,
                    createdAt: clienteMasterCompleto.createdAt,
                    updatedAt: clienteMasterCompleto.updatedAt,
                    tipo: 'master',
                    assinatura: assinatura
                        ? {
                            id: assinatura.id,
                            status: assinatura.status,
                            planoId: assinatura.planoId,
                            ...(planoInfo && { plano: planoInfo }),
                        }
                        : null,
                    nomeEmpresa: clienteMasterCompleto.nomeEmpresa,
                    logo: clienteMasterCompleto.logo,
                    cor: clienteMasterCompleto.cor,
                    documento: clienteMasterCompleto.cnpj,
                });
            }
        }
        console.log('DEBUG - Buscando UserComum para userBase.id:', userBase.id);
        const usuariosComuns = await this.userComumService.findByUserId(userBase.id);
        console.log('DEBUG - userBase.id:', userBase.id);
        console.log('DEBUG - usuariosComuns encontrados:', usuariosComuns ? usuariosComuns.length : 0);
        if (usuariosComuns && usuariosComuns.length > 0) {
            console.log('DEBUG - Primeiro userComum:', {
                id: usuariosComuns[0].id,
                userId: usuariosComuns[0].userId,
                clienteMasterId: usuariosComuns[0].clienteMasterId,
                ativo: usuariosComuns[0].ativo,
                status: usuariosComuns[0].status,
            });
        }
        else {
            console.log('DEBUG - NENHUM UserComum encontrado para userBase.id:', userBase.id);
        }
        if (usuariosComuns && usuariosComuns.length > 0) {
            for (const userComum of usuariosComuns) {
                if (!userComum.clienteMasterId) {
                    console.log('DEBUG - UserComum sem clienteMasterId:', userComum.id);
                    continue;
                }
                console.log('DEBUG - Buscando ClienteMaster com ID:', userComum.clienteMasterId);
                const clienteMasterVinculado = await this.clientesMasterService.findById(userComum.clienteMasterId);
                console.log('DEBUG - ClienteMaster encontrado:', clienteMasterVinculado ? 'SIM' : 'NÃO');
                if (!clienteMasterVinculado) {
                    console.log('DEBUG - ClienteMaster não encontrado para clienteMasterId:', userComum.clienteMasterId);
                    continue;
                }
                console.log('DEBUG - ClienteMaster encontrado com ID:', clienteMasterVinculado.id);
                if (!clienteMasterVinculado.user) {
                    const clienteMasterComRelacoes = await this.clientesMasterService.findById(clienteMasterVinculado.id);
                    if (!clienteMasterComRelacoes || !clienteMasterComRelacoes.user) {
                        continue;
                    }
                    Object.assign(clienteMasterVinculado, clienteMasterComRelacoes);
                }
                const jaExiste = clientesMasterAssociados.some((cm) => cm.id === clienteMasterVinculado.id);
                if (!jaExiste) {
                    const assinatura = await this.assinaturasService.findByUserId(clienteMasterVinculado.id);
                    let planoInfo = undefined;
                    if (assinatura && assinatura.planoId) {
                        const plano = await this.planosService.findById(assinatura.planoId);
                        if (plano) {
                            planoInfo = {
                                id: plano.id,
                                nome: plano.nome,
                                valor: plano.valorPromocional || plano.valorOriginal,
                                tokenChat: plano.tokenChat,
                                analises: plano.limiteAnalises,
                            };
                        }
                    }
                    clientesMasterAssociados.push({
                        id: clienteMasterVinculado.id,
                        hash: clienteMasterVinculado.hash,
                        nome: clienteMasterVinculado.user.nome,
                        email: clienteMasterVinculado.user.email,
                        telefone: clienteMasterVinculado.user.telefone,
                        cnpj: clienteMasterVinculado.cnpj,
                        ativo: clienteMasterVinculado.ativo,
                        isVerified: clienteMasterVinculado.user.isVerified,
                        createdAt: clienteMasterVinculado.createdAt,
                        updatedAt: clienteMasterVinculado.updatedAt,
                        tipo: 'associado',
                        assinatura: assinatura
                            ? {
                                id: assinatura.id,
                                status: assinatura.status,
                                planoId: assinatura.planoId,
                                ...(planoInfo && { plano: planoInfo }),
                            }
                            : null,
                        nomeEmpresa: clienteMasterVinculado.nomeEmpresa,
                        logo: clienteMasterVinculado.logo,
                        cor: clienteMasterVinculado.cor,
                        documento: clienteMasterVinculado.cnpj,
                    });
                }
            }
        }
        if (clientesMasterAssociados.length === 0) {
            throw new common_1.BadRequestException('Nenhum Cliente Master encontrado para este usuário. Verifique se o usuário é dono de um Cliente Master ou está vinculado como usuário comum.');
        }
        const userBaseData = {
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
        };
        return {
            quantidade: clientesMasterAssociados.length,
            user: userBaseData,
            clientesMaster: clientesMasterAssociados,
        };
    }
    async getClientMasterByEmail(email) {
        const clientesMasterAssociados = [];
        const userBase = await this.userBaseService.findByEmail(email);
        if (!userBase) {
            throw new common_1.BadRequestException('Nenhum usuário encontrado para este e-mail.');
        }
        const todosClientesMaster = await this.clientesMasterService.findByUserId(userBase.id);
        for (const clienteMaster of todosClientesMaster) {
            let clienteMasterCompleto = clienteMaster;
            if (!clienteMaster.user) {
                const clienteMasterComRelacoes = await this.clientesMasterService.findById(clienteMaster.id);
                if (!clienteMasterComRelacoes || !clienteMasterComRelacoes.user) {
                    continue;
                }
                clienteMasterCompleto = clienteMasterComRelacoes;
            }
            const assinatura = await this.assinaturasService.findByUserId(clienteMasterCompleto.id);
            let planoInfo = undefined;
            if (assinatura && assinatura.planoId) {
                const plano = await this.planosService.findById(assinatura.planoId);
                if (plano) {
                    planoInfo = {
                        id: plano.id,
                        nome: plano.nome,
                        valor: plano.valorPromocional || plano.valorOriginal,
                        tokenChat: plano.tokenChat,
                        analises: plano.limiteAnalises,
                    };
                }
            }
            clientesMasterAssociados.push({
                id: clienteMasterCompleto.id,
                hash: clienteMasterCompleto.hash,
                nome: clienteMasterCompleto.user.nome,
                email: clienteMasterCompleto.user.email,
                telefone: clienteMasterCompleto.user.telefone,
                cnpj: clienteMasterCompleto.cnpj,
                ativo: clienteMasterCompleto.ativo,
                isVerified: clienteMasterCompleto.user.isVerified,
                createdAt: clienteMasterCompleto.createdAt,
                updatedAt: clienteMasterCompleto.updatedAt,
                tipo: 'master',
                assinatura: assinatura
                    ? {
                        id: assinatura.id,
                        status: assinatura.status,
                        planoId: assinatura.planoId,
                        ...(planoInfo && { plano: planoInfo }),
                    }
                    : null,
                nomeEmpresa: clienteMasterCompleto.nomeEmpresa,
                logo: clienteMasterCompleto.logo,
                cor: clienteMasterCompleto.cor,
                documento: clienteMasterCompleto.cnpj,
            });
        }
        const usuariosComuns = await this.userComumService.findByUserId(userBase.id);
        for (const userComum of usuariosComuns) {
            const clienteMasterAssociado = await this.clientesMasterService.findById(userComum.clienteMasterId);
            if (clienteMasterAssociado) {
                if (!clienteMasterAssociado.user) {
                    const clienteMasterComRelacoes = await this.clientesMasterService.findById(clienteMasterAssociado.id);
                    if (!clienteMasterComRelacoes || !clienteMasterComRelacoes.user) {
                        continue;
                    }
                    Object.assign(clienteMasterAssociado, clienteMasterComRelacoes);
                }
                const jaExiste = clientesMasterAssociados.some((cm) => cm.id === clienteMasterAssociado.id);
                if (!jaExiste) {
                    const assinatura = await this.assinaturasService.findByUserId(clienteMasterAssociado.id);
                    let planoInfo = undefined;
                    if (assinatura && assinatura.planoId) {
                        const plano = await this.planosService.findById(assinatura.planoId);
                        if (plano) {
                            planoInfo = {
                                id: plano.id,
                                nome: plano.nome,
                                valor: plano.valorPromocional || plano.valorOriginal,
                                tokenChat: plano.tokenChat,
                                analises: plano.limiteAnalises,
                            };
                        }
                    }
                    clientesMasterAssociados.push({
                        id: clienteMasterAssociado.id,
                        hash: clienteMasterAssociado.hash,
                        nome: clienteMasterAssociado.user.nome,
                        email: clienteMasterAssociado.user.email,
                        telefone: clienteMasterAssociado.user.telefone,
                        cnpj: clienteMasterAssociado.cnpj,
                        ativo: clienteMasterAssociado.ativo,
                        isVerified: clienteMasterAssociado.user.isVerified,
                        createdAt: clienteMasterAssociado.createdAt,
                        updatedAt: clienteMasterAssociado.updatedAt,
                        tipo: 'associado',
                        assinatura: assinatura
                            ? {
                                id: assinatura.id,
                                status: assinatura.status,
                                planoId: assinatura.planoId,
                                ...(planoInfo && { plano: planoInfo }),
                            }
                            : null,
                        nomeEmpresa: clienteMasterAssociado.nomeEmpresa,
                        logo: clienteMasterAssociado.logo,
                        cor: clienteMasterAssociado.cor,
                        documento: clienteMasterAssociado.cnpj,
                    });
                }
            }
        }
        if (clientesMasterAssociados.length === 0) {
            throw new common_1.BadRequestException('Nenhum Cliente Master encontrado para este e-mail.');
        }
        const userBaseData = {
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
        };
        return {
            quantidade: clientesMasterAssociados.length,
            user: userBaseData,
            clientesMaster: clientesMasterAssociados,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        user_base_service_1.UserBaseService,
        user_comum_service_1.UserComumService,
        clientes_master_service_1.ClientesMasterService,
        assinaturas_service_1.AssinaturasService,
        planos_service_1.PlanosService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map