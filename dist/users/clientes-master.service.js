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
const cliente_master_entity_1 = require("./entities/cliente-master.entity");
let ClientesMasterService = class ClientesMasterService {
    constructor(clienteMasterRepository) {
        this.clienteMasterRepository = clienteMasterRepository;
    }
    async create(data) {
        const clienteMaster = this.clienteMasterRepository.create(data);
        return this.clienteMasterRepository.save(clienteMaster);
    }
    async findByEmail(email) {
        return this.clienteMasterRepository.findOne({ where: { email } });
    }
    async findById(id) {
        return this.clienteMasterRepository.findOne({
            where: { id },
            relations: ['usuarios', 'assinaturas'],
        });
    }
    async findAll() {
        return this.clienteMasterRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async update(id, data) {
        await this.clienteMasterRepository.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await this.clienteMasterRepository.delete(id);
    }
};
exports.ClientesMasterService = ClientesMasterService;
exports.ClientesMasterService = ClientesMasterService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cliente_master_entity_1.ClienteMaster)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ClientesMasterService);
//# sourceMappingURL=clientes-master.service.js.map