import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
export declare class AuthService {
    private usersService;
    private clientesMasterService;
    private assinaturasService;
    private planosService;
    private jwtService;
    constructor(usersService: UsersService, clientesMasterService: ClientesMasterService, assinaturasService: AssinaturasService, planosService: PlanosService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(email: string, password: string): Promise<{
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
            };
        };
    }>;
    registerClienteMaster(data: {
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
    registerUser(data: {
        nome: string;
        email: string;
        password: string;
        clienteMasterId: string;
    }, clienteMasterId: string): Promise<{
        access_token: string;
        user: {
            id: string;
            nome: string;
            email: string;
            tipo: import("../users/entities/user.entity").UserType;
            clienteMasterId: string;
        };
    }>;
    logout(user: any): Promise<{
        message: string;
        userId: any;
    }>;
}
