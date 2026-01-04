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
exports.AnalisesController = void 0;
const common_1 = require("@nestjs/common");
const analises_service_1 = require("./analises.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AnalisesController = class AnalisesController {
    analisesService;
    constructor(analisesService) {
        this.analisesService = analisesService;
    }
    async registrarAnalise(req) {
        return this.analisesService.registrarAnalise(req.user.id, req.user.tipo);
    }
    async registrarTokens(req, body) {
        return this.analisesService.registrarTokens(req.user.id, req.user.tipo, body.tokens);
    }
    async getHistoricoSemAno(req) {
        return this.analisesService.getHistorico(req.user.id, req.user.tipo);
    }
    async getHistoricoComAno(req, ano) {
        return this.analisesService.getHistorico(req.user.id, req.user.tipo, ano);
    }
};
exports.AnalisesController = AnalisesController;
__decorate([
    (0, common_1.Post)('registrar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalisesController.prototype, "registrarAnalise", null);
__decorate([
    (0, common_1.Post)('registrar-tokens'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalisesController.prototype, "registrarTokens", null);
__decorate([
    (0, common_1.Get)('historico'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalisesController.prototype, "getHistoricoSemAno", null);
__decorate([
    (0, common_1.Get)('historico/:ano'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('ano')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnalisesController.prototype, "getHistoricoComAno", null);
exports.AnalisesController = AnalisesController = __decorate([
    (0, common_1.Controller)('analises'),
    __metadata("design:paramtypes", [analises_service_1.AnalisesService])
], AnalisesController);
//# sourceMappingURL=analises.controller.js.map