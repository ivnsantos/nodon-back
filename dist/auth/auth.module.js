"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const validate_resource_access_guard_1 = require("./guards/validate-resource-access.guard");
const users_module_1 = require("../users/users.module");
const clientes_master_module_1 = require("../users/clientes-master.module");
const assinaturas_module_1 = require("../assinaturas/assinaturas.module");
const planos_module_1 = require("../planos/planos.module");
const email_module_1 = require("../email/email.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            clientes_master_module_1.ClientesMasterModule,
            assinaturas_module_1.AssinaturasModule,
            planos_module_1.PlanosModule,
            email_module_1.EmailModule,
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET', 'NodonDentista@8898GOLdoPalmeiras'),
                    signOptions: { expiresIn: '7d' },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy, validate_resource_access_guard_1.ValidateResourceAccessGuard],
        exports: [auth_service_1.AuthService, validate_resource_access_guard_1.ValidateResourceAccessGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map