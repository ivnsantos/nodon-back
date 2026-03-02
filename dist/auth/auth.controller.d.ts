import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetPhoneDto } from './dto/request-password-reset-phone.dto';
import { ValidatePasswordResetCodeDto } from './dto/validate-password-reset-code.dto';
import { ResetPasswordWithCodeDto } from './dto/reset-password-with-code.dto';
export declare class AuthController {
    private authService;
    private clientesMasterService;
    private configService;
    constructor(authService: AuthService, clientesMasterService: ClientesMasterService, configService: ConfigService);
    private getFrontendUrl;
    login(loginDto: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            nome: any;
            email: any;
            telefone: string | null;
            tipo: any;
            isAdmin: boolean;
            isEmailVerified: boolean;
            isMasterKeyLogin: any;
            assinatura: {
                id: any;
                status: any;
                planoId: any;
                plano: any;
            } | null;
        };
    }>;
    registerMaster(registerDto: {
        nome: string;
        email: string;
        password: string;
        telefone?: string;
        cnpj?: string;
    }): Promise<{
        message: string;
        user: {
            id: string;
            userId: string;
            nome: string;
            email: string;
            tipo: string;
            isVerified: boolean;
        };
    }>;
    registerUser(registerDto: {
        nome: string;
        email: string;
        password: string;
        clienteMasterId?: string;
    }, req: any): Promise<{
        message: string;
        user: {
            id: string;
            nome: string;
            email: string;
            tipo: string;
            clienteMasterId: string;
            isVerified: boolean;
        };
    }>;
    logout(req: any): Promise<{
        message: string;
        userId: any;
    }>;
    verifyPhone(body: {
        telefone: string;
        code: string;
    }): Promise<{
        message: string;
    }>;
    resendVerificationCode(body: {
        telefone: string;
    }): Promise<{
        message: string;
        code?: undefined;
        warning?: undefined;
    } | {
        message: string;
        code: string;
        warning: string;
    }>;
    verifyEmail(body: {
        email: string;
        code: string;
    }): Promise<{
        message: string;
    }>;
    getMe(req: any): Promise<{
        id: string;
        nome: string;
        email: string;
        foto: string | null;
        telefone: string;
        cpf: string;
        cro: string;
        isVerified: boolean;
        tipo: string;
        clienteMasterId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getClientByToken(req: any): Promise<{
        quantidade: number;
        user: {
            id: string;
            nome: string;
            email: string;
            cpf: string;
            telefone: string;
            cro: string;
            postalCode: string;
            address: string;
            addressNumber: string;
            complement: string;
            province: string;
            city: string;
            state: string;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        clientesMaster: import("./auth.service").ClienteMasterInfo[];
    }>;
    googleAuth(): Promise<void>;
    googleAuthCallback(req: any, res: Response): Promise<void>;
    googleLoginWithToken(body: {
        googleId: string;
        email: string;
        nome: string;
        foto?: string;
    }): Promise<{
        isNewUser: boolean;
        access_token: null;
        user: null;
        googleData: {
            googleId: string;
            email: string;
            nome: string;
            foto: string | null | undefined;
        };
    } | {
        isNewUser: boolean;
        access_token: string;
        user: {
            id: string;
            nome: string;
            email: string;
            tipo: string;
            isAdmin: boolean;
            isEmailVerified: boolean;
            assinatura: {
                id: any;
                status: any;
                planoId: any;
                plano: any;
            } | null;
        };
        googleData?: undefined;
    }>;
    facebookAuth(): Promise<void>;
    facebookAuthCallback(req: any, res: Response): Promise<void>;
    facebookLoginWithToken(body: {
        facebookId: string;
        email: string;
        nome: string;
        foto?: string;
    }): Promise<{
        isNewUser: boolean;
        access_token: null;
        user: null;
        facebookData: {
            facebookId: string;
            email: string;
            nome: string;
            foto: string | null | undefined;
        };
    } | {
        isNewUser: boolean;
        access_token: string;
        user: {
            id: string;
            nome: string;
            email: string;
            foto: string | null;
            tipo: string;
            isAdmin: boolean;
            isEmailVerified: boolean;
            clienteMasterId: string;
            assinatura: {
                id: any;
                status: any;
                planoId: any;
                plano: any;
            } | null;
        };
        facebookData?: undefined;
    }>;
    forgotPassword(requestPasswordResetDto: RequestPasswordResetDto): Promise<{
        message: string;
        token?: undefined;
        resetUrl?: undefined;
    } | {
        message: string;
        token: any;
        resetUrl: string;
    }>;
    validateResetToken(token: string): Promise<{
        valid: boolean;
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    forgotPasswordPhone(requestPasswordResetPhoneDto: RequestPasswordResetPhoneDto): Promise<{
        message: string;
    }>;
    validatePasswordResetCode(validateCodeDto: ValidatePasswordResetCodeDto): Promise<{
        valid: boolean;
        message: string;
    }>;
    resetPasswordWithCode(resetPasswordWithCodeDto: ResetPasswordWithCodeDto): Promise<{
        message: string;
    }>;
}
