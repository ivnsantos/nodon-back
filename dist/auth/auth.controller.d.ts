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
        access_token: string;
        user: {
            id: string;
            nome: string;
            email: string;
            tipo: string;
        };
    }>;
    registerUser(registerDto: {
        nome: string;
        email: string;
        password: string;
        clienteMasterId: string;
    }, req: any): Promise<{
        access_token: string;
        user: {
            id: string;
            nome: string;
            email: string;
            tipo: import("../users/entities/user.entity").UserType;
            clienteMasterId: string;
        };
    }>;
    logout(req: any): Promise<{
        message: string;
        userId: any;
    }>;
}
