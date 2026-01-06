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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const user_comum_entity_1 = require("./entities/user-comum.entity");
let UsersService = class UsersService {
    userRepository;
    userComumRepository;
    constructor(userRepository, userComumRepository) {
        this.userRepository = userRepository;
        this.userComumRepository = userComumRepository;
    }
    async create(data) {
        const user = this.userRepository.create({
            ...data,
            tipo: data.tipo || user_entity_1.UserType.USER,
            isVerified: data.isVerified ?? false,
            verificationToken: data.verificationToken ?? null,
            tokenExpiresAt: data.tokenExpiresAt ?? null,
        });
        return this.userRepository.save(user);
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email } });
    }
    async findById(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async findAllByClienteMaster(clienteMasterId) {
        return this.userComumRepository.find({
            where: { clienteMasterId },
            relations: ['user', 'clienteMaster'],
            order: { createdAt: 'DESC' },
        });
    }
    async update(id, data) {
        await this.userRepository.update(id, data);
        const user = await this.findById(id);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }
        return user;
    }
    async delete(id) {
        await this.userRepository.delete(id);
    }
    async findByVerificationToken(token) {
        return this.userRepository.findOne({ where: { verificationToken: token } });
    }
    async updateVerificationStatus(id, isVerified) {
        await this.userRepository.update(id, {
            isVerified,
            verificationToken: null,
            tokenExpiresAt: null,
        });
        const user = await this.findById(id);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_comum_entity_1.UserComum)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map