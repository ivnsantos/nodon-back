import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserBaseService } from '../users/services/user-base.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { EmailService } from '../email/email.service';
export interface ClienteMasterInfo {
    id: string;
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
    private clientesMasterService;
    private assinaturasService;
    private planosService;
    private jwtService;
    private emailService;
    constructor(usersService: UsersService, userBaseService: UserBaseService, clientesMasterService: ClientesMasterService, assinaturasService: AssinaturasService, planosService: PlanosService, jwtService: JwtService, emailService: EmailService);
    validateUser(email: string, password: string): Promise<any>;
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: any;
            nome: any;
            email: any;
            tipo: any;
            isAdmin: boolean;
            isEmailVerified: boolean;
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
            tipo: import("../users/entities/user.entity").UserType;
            clienteMasterId: string;
            isVerified: boolean;
        };
    }>;
    logout(user: any): Promise<{
        message: string;
        userId: any;
    }>;
    verifyEmail(email: string, code: string): Promise<{
        message: string;
    }>;
    resendVerificationCode(email: string): Promise<{
        message: string;
        code?: undefined;
        warning?: undefined;
    } | {
        message: string;
        code: string;
        warning: string;
    }>;
    getClientMasterByEmail(email: string): Promise<{
        quantidade: number;
        clientesMaster: ClienteMasterInfo[];
    }>;
}
