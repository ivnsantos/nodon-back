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
exports.AnalisesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const historico_mensal_entity_1 = require("./entities/historico-mensal.entity");
const clientes_master_service_1 = require("../users/clientes-master.service");
const assinaturas_service_1 = require("../assinaturas/assinaturas.service");
const planos_service_1 = require("../planos/planos.service");
const user_comum_service_1 = require("../users/services/user-comum.service");
let AnalisesService = class AnalisesService {
    historicoRepository;
    clientesMasterService;
    assinaturasService;
    planosService;
    userComumService;
    constructor(historicoRepository, clientesMasterService, assinaturasService, planosService, userComumService) {
        this.historicoRepository = historicoRepository;
        this.clientesMasterService = clientesMasterService;
        this.assinaturasService = assinaturasService;
        this.planosService = planosService;
        this.userComumService = userComumService;
    }
    async registrarAnalise(userId, userTipo) {
        let clienteMasterId;
        if (userTipo === 'master') {
            const clientesMaster = await this.clientesMasterService.findByUserId(userId);
            if (!clientesMaster || clientesMaster.length === 0) {
                throw new common_1.NotFoundException('Cliente Master não encontrado');
            }
            clienteMasterId = clientesMaster[0].id;
        }
        else {
            const usuariosComuns = await this.userComumService.findByUserId(userId);
            if (usuariosComuns && usuariosComuns.length > 0) {
                clienteMasterId = usuariosComuns[0].clienteMasterId;
            }
            else {
                throw new common_1.NotFoundException('Cliente Master não encontrado');
            }
        }
        const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = agora.getMonth() + 1;
        let historico = await this.historicoRepository.findOne({
            where: {
                clienteMasterId,
                ano,
                mes,
            },
        });
        if (historico) {
            historico.analisesFeitas = (historico.analisesFeitas || 0) + 1;
            await this.historicoRepository.save(historico);
        }
        else {
            historico = this.historicoRepository.create({
                clienteMasterId,
                ano,
                mes,
                tokensUtilizados: 0,
                analisesFeitas: 1,
            });
            await this.historicoRepository.save(historico);
        }
        return {
            message: 'Análise registrada com sucesso',
            analisesFeitas: historico.analisesFeitas,
        };
    }
    async registrarTokens(userId, userTipo, tokens) {
        let clienteMasterId;
        if (userTipo === 'master') {
            const clientesMaster = await this.clientesMasterService.findByUserId(userId);
            if (!clientesMaster || clientesMaster.length === 0) {
                throw new common_1.NotFoundException('Cliente Master não encontrado');
            }
            clienteMasterId = clientesMaster[0].id;
        }
        else {
            const usuariosComuns = await this.userComumService.findByUserId(userId);
            if (usuariosComuns && usuariosComuns.length > 0) {
                clienteMasterId = usuariosComuns[0].clienteMasterId;
            }
            else {
                throw new common_1.NotFoundException('Cliente Master não encontrado');
            }
        }
        const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = agora.getMonth() + 1;
        let historico = await this.historicoRepository.findOne({
            where: {
                clienteMasterId,
                ano,
                mes,
            },
        });
        if (historico) {
            historico.tokensUtilizados = (historico.tokensUtilizados || 0) + tokens;
            await this.historicoRepository.save(historico);
        }
        else {
            historico = this.historicoRepository.create({
                clienteMasterId,
                ano,
                mes,
                tokensUtilizados: tokens,
                analisesFeitas: 0,
            });
            await this.historicoRepository.save(historico);
        }
        return {
            message: 'Tokens registrados com sucesso',
            tokens: tokens,
            tokensUtilizados: historico.tokensUtilizados,
        };
    }
    async getHistoricoMensal(clienteMasterId, ano) {
        const where = { clienteMasterId };
        if (ano) {
            where.ano = ano;
        }
        return this.historicoRepository.find({
            where,
            order: { ano: 'DESC', mes: 'DESC' },
        });
    }
    async getHistorico(userId, userTipo, ano) {
        let clienteMasterId;
        if (userTipo === 'master') {
            const clientesMaster = await this.clientesMasterService.findByUserId(userId);
            if (!clientesMaster || clientesMaster.length === 0) {
                throw new common_1.NotFoundException('Cliente Master não encontrado');
            }
            clienteMasterId = clientesMaster[0].id;
        }
        else {
            const usuariosComuns = await this.userComumService.findByUserId(userId);
            if (usuariosComuns && usuariosComuns.length > 0) {
                clienteMasterId = usuariosComuns[0].clienteMasterId;
            }
            else {
                throw new common_1.NotFoundException('Cliente Master não encontrado');
            }
        }
        const anoNumero = ano ? parseInt(ano, 10) : undefined;
        return this.getHistoricoMensal(clienteMasterId, anoNumero);
    }
};
exports.AnalisesService = AnalisesService;
exports.AnalisesService = AnalisesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(historico_mensal_entity_1.HistoricoMensal)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => clientes_master_service_1.ClientesMasterService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => assinaturas_service_1.AssinaturasService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        clientes_master_service_1.ClientesMasterService,
        assinaturas_service_1.AssinaturasService,
        planos_service_1.PlanosService,
        user_comum_service_1.UserComumService])
], AnalisesService);
//# sourceMappingURL=analises.service.js.map