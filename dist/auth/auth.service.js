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
const clientes_master_service_1 = require("../users/clientes-master.service");
const assinaturas_service_1 = require("../assinaturas/assinaturas.service");
const planos_service_1 = require("../planos/planos.service");
let AuthService = class AuthService {
    constructor(usersService, clientesMasterService, assinaturasService, planosService, jwtService) {
        this.usersService = usersService;
        this.clientesMasterService = clientesMasterService;
        this.assinaturasService = assinaturasService;
        this.planosService = planosService;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        const clienteMaster = await this.clientesMasterService.findByEmail(email);
        if (clienteMaster) {
            const isPasswordValid = await bcrypt.compare(password, clienteMaster.password);
            if (isPasswordValid && clienteMaster.ativo) {
                const { password: _, ...result } = clienteMaster;
                return { ...result, tipo: 'master' };
            }
        }
        const user = await this.usersService.findByEmail(email);
        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid && user.ativo) {
                const { password: _, ...result } = user;
                return result;
            }
        }
        return null;
    }
    async login(email, password) {
        const user = await this.validateUser(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const tipo = user.tipo || 'usuario';
        const isAdmin = tipo === 'master';
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
        const payload = {
            id: user.id,
            email: user.email,
            tipo: tipo,
            clienteMasterId: user.clienteMasterId || null,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                tipo: tipo,
                isAdmin: isAdmin,
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
        const existing = await this.clientesMasterService.findByEmail(data.email);
        if (existing) {
            throw new common_1.ConflictException('Email já cadastrado');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const clienteMaster = await this.clientesMasterService.create({
            ...data,
            password: hashedPassword,
        });
        const payload = {
            id: clienteMaster.id,
            email: clienteMaster.email,
            tipo: 'master',
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: clienteMaster.id,
                nome: clienteMaster.nome,
                email: clienteMaster.email,
                tipo: 'master',
            },
        };
    }
    async registerUser(data, clienteMasterId) {
        const existing = await this.usersService.findByEmail(data.email);
        if (existing) {
            throw new common_1.ConflictException('Email já cadastrado');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.usersService.create({
            ...data,
            password: hashedPassword,
            clienteMasterId,
        });
        const payload = {
            id: user.id,
            email: user.email,
            tipo: user.tipo,
            clienteMasterId: user.clienteMasterId,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                tipo: user.tipo,
                clienteMasterId: user.clienteMasterId,
            },
        };
    }
    async logout(user) {
        return {
            message: 'Logout realizado com sucesso',
            userId: user.id,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        clientes_master_service_1.ClientesMasterService,
        assinaturas_service_1.AssinaturasService,
        planos_service_1.PlanosService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map