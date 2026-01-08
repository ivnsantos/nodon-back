"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsMasterGuard = void 0;
const common_1 = require("@nestjs/common");
let IsMasterGuard = class IsMasterGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || user.tipo !== 'master') {
            throw new common_1.ForbiddenException('Acesso negado. Apenas clientes master podem realizar esta ação.');
        }
        return true;
    }
};
exports.IsMasterGuard = IsMasterGuard;
exports.IsMasterGuard = IsMasterGuard = __decorate([
    (0, common_1.Injectable)()
], IsMasterGuard);
//# sourceMappingURL=is-master.guard.js.map