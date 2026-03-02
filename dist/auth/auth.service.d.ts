import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserBaseService } from '../users/services/user-base.service';
import { UserComumService } from '../users/services/user-comum.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
export interface ClienteMasterInfo {
    id: string;
    hash: string | null;
    nome: string;
    email: string;
    telefone: string | null;
    cnpj: string | null;
    ativo: boolean;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    tipo: 'master' | 'associado';
    assinatura: {
        id: string | null;
        status: string | null;
        planoId: string | null;
        plano?: {
            id: string;
            nome: string;
            valor: number;
            tokenChat: number;
            analises: number;
            acesso: string;
        };
    } | null;
    nomeEmpresa: string | null;
    logo: string | null;
    cor: string | null;
    documento: string | null;
}
export declare class AuthService {
    private usersService;
    private userBaseService;
    private userComumService;
    private clientesMasterService;
    private assinaturasService;
    private planosService;
    private jwtService;
    private whatsappService;
    constructor(usersService: UsersService, userBaseService: UserBaseService, userComumService: UserComumService, clientesMasterService: ClientesMasterService, assinaturasService: AssinaturasService, planosService: PlanosService, jwtService: JwtService, whatsappService: WhatsAppService);
    validateUser(email: string, password: string): Promise<any>;
    login(email: string, password: string): Promise<{
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
    registerClienteMaster(data: {
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
    registerUser(data: {
        nome: string;
        email: string;
        password: string;
        clienteMasterId: string;
    }, clienteMasterId: string): Promise<{
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
    logout(user: any): Promise<{
        message: string;
        userId: any;
    }>;
    validateToken(token: string): Promise<any>;
    getMe(userBaseId: string): Promise<{
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
    generateTokenForUser(userId: string, email: string, tipo: string): Promise<string>;
    verifyPhone(telefone: string, code: string): Promise<{
        message: string;
    }>;
    verifyEmail(email: string, code: string): Promise<{
        message: string;
    }>;
    resendVerificationCode(telefone: string): Promise<{
        message: string;
        code?: undefined;
        warning?: undefined;
    } | {
        message: string;
        code: string;
        warning: string;
    }>;
    getClientMasterByUserBaseId(userBaseId: string): Promise<{
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
        clientesMaster: ClienteMasterInfo[];
    }>;
    googleLogin(googleUser: {
        googleId: string;
        email: string;
        nome: string;
        foto?: string | null;
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
    facebookLogin(facebookUser: {
        facebookId: string;
        email: string | null;
        nome: string;
        foto?: string | null;
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
    getClientMasterByEmail(email: string): Promise<{
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
        clientesMaster: ClienteMasterInfo[];
    }>;
    requestPasswordReset(email: string, frontendUrl: string): Promise<{
        message: string;
        token?: undefined;
        resetUrl?: undefined;
    } | {
        message: string;
        token: any;
        resetUrl: string;
    }>;
    validatePasswordResetToken(token: string): Promise<{
        valid: boolean;
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    requestPasswordResetPhone(email: string, telefone: string): Promise<{
        message: string;
    }>;
    validatePasswordResetCode(code: string, telefone: string): Promise<{
        valid: boolean;
        message: string;
    }>;
    resetPasswordWithCode(code: string, telefone: string, newPassword: string): Promise<{
        message: string;
    }>;
}
