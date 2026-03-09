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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const clientes_master_service_1 = require("../users/clientes-master.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const is_master_guard_1 = require("./guards/is-master.guard");
const google_auth_guard_1 = require("./guards/google-auth.guard");
const facebook_auth_guard_1 = require("./guards/facebook-auth.guard");
const request_password_reset_dto_1 = require("./dto/request-password-reset.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const request_password_reset_phone_dto_1 = require("./dto/request-password-reset-phone.dto");
const validate_password_reset_code_dto_1 = require("./dto/validate-password-reset-code.dto");
const reset_password_with_code_dto_1 = require("./dto/reset-password-with-code.dto");
const newrelic_logger_1 = require("../common/utils/newrelic-logger");
let AuthController = class AuthController {
    authService;
    clientesMasterService;
    configService;
    constructor(authService, clientesMasterService, configService) {
        this.authService = authService;
        this.clientesMasterService = clientesMasterService;
        this.configService = configService;
    }
    getFrontendUrl() {
        const isProd = this.configService.get('NODE_ENV') === 'production';
        return isProd
            ? this.configService.get('FRONTEND_URL_PROD', 'https://nodon.com.br')
            : this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    }
    async login(loginDto) {
        (0, newrelic_logger_1.newRelicLog)('info', 'Login attempt', { email: loginDto.email });
        return this.authService.login(loginDto.email, loginDto.password);
    }
    async registerMaster(registerDto) {
        return this.authService.registerClienteMaster(registerDto);
    }
    async registerUser(registerDto, req) {
        let clienteMasterId = registerDto.clienteMasterId;
        if (!clienteMasterId) {
            const clientesMaster = await this.clientesMasterService.findByUserId(req.user.id);
            if (!clientesMaster || clientesMaster.length === 0) {
                throw new common_1.NotFoundException('Cliente Master não encontrado para este usuário');
            }
            clienteMasterId = clientesMaster[0].id;
        }
        const registerData = {
            ...registerDto,
            clienteMasterId,
        };
        return this.authService.registerUser(registerData, clienteMasterId);
    }
    async logout(req) {
        return this.authService.logout(req.user);
    }
    async verifyPhone(body) {
        if (!body.telefone || !body.code) {
            throw new common_1.BadRequestException('Telefone e código são obrigatórios');
        }
        return this.authService.verifyPhone(body.telefone, body.code);
    }
    async resendVerificationCode(body) {
        if (!body.telefone) {
            throw new common_1.BadRequestException('Telefone é obrigatório');
        }
        return this.authService.resendVerificationCode(body.telefone);
    }
    async verifyEmail(body) {
        if (!body.email || !body.code) {
            throw new common_1.BadRequestException('E-mail e código são obrigatórios');
        }
        return this.authService.verifyEmail(body.email, body.code);
    }
    async getMe(req) {
        return this.authService.getMe(req.user.id);
    }
    async getClientByToken(req) {
        const userBaseId = req.user.id;
        return this.authService.getClientMasterByUserBaseId(userBaseId);
    }
    async googleAuth() {
        const clientID = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        if (!clientID || !clientSecret) {
            throw new common_1.BadRequestException('Google OAuth não está configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no arquivo .env');
        }
    }
    async googleAuthCallback(req, res) {
        try {
            console.log('Google Callback - req.user:', req.user);
            const result = await this.authService.googleLogin(req.user);
            console.log('Google Login Result:', result);
            const frontendUrl = this.getFrontendUrl();
            if (result.isNewUser) {
                const params = new URLSearchParams({
                    isNewUser: 'true',
                    email: result.googleData?.email || '',
                    nome: result.googleData?.nome || '',
                    googleId: result.googleData?.googleId || '',
                    foto: result.googleData?.foto || ''
                });
                return res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
            }
            const userEncoded = encodeURIComponent(JSON.stringify(result.user));
            const params = new URLSearchParams({
                token: result.access_token || '',
                isNewUser: 'false',
                user: userEncoded
            });
            return res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
        }
        catch (error) {
            console.error('Erro no Google Callback:', error);
            const frontendUrl = this.getFrontendUrl();
            return res.redirect(`${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message)}`);
        }
    }
    async googleLoginWithToken(body) {
        if (!body.googleId || !body.email || !body.nome) {
            throw new common_1.BadRequestException('googleId, email e nome são obrigatórios');
        }
        return this.authService.googleLogin({
            googleId: body.googleId,
            email: body.email,
            nome: body.nome,
            foto: body.foto,
        });
    }
    async facebookAuth() {
    }
    async facebookAuthCallback(req, res) {
        try {
            console.log('Facebook Callback - req.user:', req.user);
            const result = await this.authService.facebookLogin(req.user);
            console.log('Facebook Login Result:', result);
            const frontendUrl = this.getFrontendUrl();
            if (result.isNewUser) {
                const params = new URLSearchParams({
                    isNewUser: 'true',
                    provider: 'facebook',
                    email: result.facebookData?.email || '',
                    nome: result.facebookData?.nome || '',
                    facebookId: result.facebookData?.facebookId || '',
                    foto: result.facebookData?.foto || ''
                });
                return res.redirect(`${frontendUrl}/auth/facebook/callback?${params.toString()}`);
            }
            const userEncoded = encodeURIComponent(JSON.stringify(result.user));
            const params = new URLSearchParams({
                token: result.access_token || '',
                isNewUser: 'false',
                user: userEncoded
            });
            return res.redirect(`${frontendUrl}/auth/facebook/callback?${params.toString()}`);
        }
        catch (error) {
            console.error('Erro no Facebook Callback:', error);
            const frontendUrl = this.getFrontendUrl();
            return res.redirect(`${frontendUrl}/auth/facebook/callback?error=${encodeURIComponent(error.message)}`);
        }
    }
    async facebookLoginWithToken(body) {
        if (!body.facebookId || !body.email || !body.nome) {
            throw new common_1.BadRequestException('facebookId, email e nome são obrigatórios');
        }
        return this.authService.facebookLogin({
            facebookId: body.facebookId,
            email: body.email,
            nome: body.nome,
            foto: body.foto,
        });
    }
    async forgotPassword(requestPasswordResetDto) {
        const frontendUrl = this.getFrontendUrl();
        return this.authService.requestPasswordReset(requestPasswordResetDto.email, frontendUrl);
    }
    async validateResetToken(token) {
        return this.authService.validatePasswordResetToken(token);
    }
    async resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    }
    async forgotPasswordPhone(requestPasswordResetPhoneDto) {
        return this.authService.requestPasswordResetPhone(requestPasswordResetPhoneDto.email, requestPasswordResetPhoneDto.telefone);
    }
    async validatePasswordResetCode(validateCodeDto) {
        return this.authService.validatePasswordResetCode(validateCodeDto.code, validateCodeDto.telefone);
    }
    async resetPasswordWithCode(resetPasswordWithCodeDto) {
        return this.authService.resetPasswordWithCode(resetPasswordWithCodeDto.code, resetPasswordWithCodeDto.telefone, resetPasswordWithCodeDto.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register-master'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerMaster", null);
__decorate([
    (0, common_1.Post)('register-user'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, is_master_guard_1.IsMasterGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerUser", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('verify-phone'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyPhone", null);
__decorate([
    (0, common_1.Post)('resend-verification-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerificationCode", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('get-client-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getClientByToken", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthCallback", null);
__decorate([
    (0, common_1.Post)('google/token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleLoginWithToken", null);
__decorate([
    (0, common_1.Get)('facebook'),
    (0, common_1.UseGuards)(facebook_auth_guard_1.FacebookAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "facebookAuth", null);
__decorate([
    (0, common_1.Get)('facebook/callback'),
    (0, common_1.UseGuards)(facebook_auth_guard_1.FacebookAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "facebookAuthCallback", null);
__decorate([
    (0, common_1.Post)('facebook/token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "facebookLoginWithToken", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_password_reset_dto_1.RequestPasswordResetDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Get)('validate-reset-token/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validateResetToken", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('forgot-password-phone'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_password_reset_phone_dto_1.RequestPasswordResetPhoneDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPasswordPhone", null);
__decorate([
    (0, common_1.Post)('validate-password-reset-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validate_password_reset_code_dto_1.ValidatePasswordResetCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validatePasswordResetCode", null);
__decorate([
    (0, common_1.Post)('reset-password-with-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_with_code_dto_1.ResetPasswordWithCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPasswordWithCode", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        clientes_master_service_1.ClientesMasterService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map