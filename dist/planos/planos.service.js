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
exports.PlanosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plano_entity_1 = require("./entities/plano.entity");
let PlanosService = class PlanosService {
    planoRepository;
    constructor(planoRepository) {
        this.planoRepository = planoRepository;
    }
    async create(data) {
        const { acesso, ...planoData } = data;
        const plano = this.planoRepository.create(planoData);
        const saved = await this.planoRepository.save(plano);
        return { ...saved, acesso: acesso || 'all' };
    }
    async findAll() {
        try {
            const planos = await this.planoRepository
                .createQueryBuilder('plano')
                .select([
                'plano.id',
                'plano.nome',
                'plano.valorOriginal',
                'plano.valorPromocional',
                'plano.limiteAnalises',
                'plano.tokenChat',
                'plano.ativo',
                'plano.descricao',
                'plano.createdAt',
                'plano.updatedAt',
            ])
                .where('plano.ativo = :ativo', { ativo: true })
                .orderBy('plano.valorOriginal', 'ASC')
                .getMany();
            return planos.map(plano => ({
                ...plano,
                acesso: plano.acesso || 'all',
            }));
        }
        catch (error) {
            console.error('❌ Erro ao buscar planos:', error);
            console.error('❌ Detalhes do erro:', {
                message: error?.message,
                stack: error?.stack,
            });
            throw error;
        }
    }
    async findById(id) {
        return this.planoRepository.findOne({ where: { id } });
    }
    async update(id, data) {
        await this.planoRepository.update(id, data);
        const plano = await this.findById(id);
        if (!plano) {
            throw new Error('Plano não encontrado');
        }
        return plano;
    }
    async delete(id) {
        await this.planoRepository.delete(id);
    }
    async seedPlanos() {
        const planos = [
            {
                nome: 'Plano Inicial',
                valorOriginal: 159,
                valorPromocional: 98,
                limiteAnalises: 12,
                tokenChat: 1500000,
                descricao: 'Até 12 análises por mês',
            },
            {
                nome: 'Plano Básico',
                valorOriginal: 299,
                valorPromocional: 179,
                limiteAnalises: 30,
                tokenChat: 1500000,
                descricao: 'Até 30 análises por mês',
            },
            {
                nome: 'Plano Premium',
                valorOriginal: 299,
                valorPromocional: null,
                limiteAnalises: 50,
                tokenChat: 1500000,
                descricao: 'Até 50 análises por mês',
            },
            {
                nome: 'Plano Essencial',
                valorOriginal: 399,
                valorPromocional: null,
                limiteAnalises: 120,
                tokenChat: 1500000,
                descricao: 'Até 120 análises por mês',
            },
            {
                nome: 'Plano Enterprise',
                valorOriginal: 499,
                valorPromocional: null,
                limiteAnalises: 200,
                tokenChat: 1500000,
                descricao: 'Até 200 análises por mês',
            },
        ];
        for (const planoData of planos) {
            const existing = await this.planoRepository.findOne({
                where: { nome: planoData.nome },
            });
            if (!existing) {
                await this.create({
                    ...planoData,
                    valorPromocional: planoData.valorPromocional ?? undefined,
                });
            }
        }
    }
    async updateAllTokenChat() {
        await this.planoRepository.update({}, { tokenChat: 1500000 });
        return { message: 'Todos os planos foram atualizados com tokenChat = 1500000' };
    }
};
exports.PlanosService = PlanosService;
exports.PlanosService = PlanosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plano_entity_1.Plano)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PlanosService);
//# sourceMappingURL=planos.service.js.map