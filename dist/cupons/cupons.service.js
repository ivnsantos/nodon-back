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
exports.CuponsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cupom_entity_1 = require("./entities/cupom.entity");
let CuponsService = class CuponsService {
    cupomRepository;
    constructor(cupomRepository) {
        this.cupomRepository = cupomRepository;
    }
    async create(data) {
        const cupom = this.cupomRepository.create({
            ...data,
            active: data.active !== undefined ? data.active : true,
        });
        return this.cupomRepository.save(cupom);
    }
    async findAll() {
        return this.cupomRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async findById(id) {
        return this.cupomRepository.findOne({ where: { id } });
    }
    async findByName(name) {
        return this.cupomRepository.findOne({ where: { name, active: true } });
    }
    async update(id, data) {
        await this.cupomRepository.update(id, data);
        const cupom = await this.findById(id);
        if (!cupom) {
            throw new Error('Cupom não encontrado');
        }
        return cupom;
    }
    async delete(id) {
        await this.cupomRepository.delete(id);
    }
};
exports.CuponsService = CuponsService;
exports.CuponsService = CuponsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cupom_entity_1.Cupom)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CuponsService);
//# sourceMappingURL=cupons.service.js.map