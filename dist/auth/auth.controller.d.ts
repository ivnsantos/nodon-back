import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: {
        email: string;
        password: string;
    }): Promise<{
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
        clienteMasterId: string;
    }, req: any): Promise<{
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
    logout(req: any): Promise<{
        message: string;
        userId: any;
    }>;
    verifyEmail(body: {
        email: string;
        code: string;
    }): Promise<{
        message: string;
    }>;
    resendVerificationCode(body: {
        email: string;
    }): Promise<{
        message: string;
        code?: undefined;
        warning?: undefined;
    } | {
        message: string;
        code: string;
        warning: string;
    }>;
    getClientByEmail(email: string): Promise<{
        quantidade: number;
        clientesMaster: import("./auth.service").ClienteMasterInfo[];
    }>;
}
