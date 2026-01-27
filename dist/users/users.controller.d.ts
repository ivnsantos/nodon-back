import { UsersService } from './users.service';
import { UserComumService } from './services/user-comum.service';
import { ClientesMasterService } from './clientes-master.service';
import { UserBaseService } from './services/user-base.service';
export declare class UsersController {
    private usersService;
    private userComumService;
    private clientesMasterService;
    private userBaseService;
    constructor(usersService: UsersService, userComumService: UserComumService, clientesMasterService: ClientesMasterService, userBaseService: UserBaseService);
    findAll(clienteMasterId: string, req: any): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            nome: string;
            email: string;
            tipo: "master" | "comum";
            ativo: boolean;
        }[];
    }>;
    findUserBase(id: string): Promise<{
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
        googleId: string | null;
        facebookId: string | null;
        foto: string | null;
        passwordResetToken: string | null;
        passwordResetExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        clientesMaster: import("./entities/cliente-master.entity").ClienteMaster[];
        usuariosComuns: import("./entities/user-comum.entity").UserComum[];
    }>;
    findOne(id: string, clienteMasterId: string, req: any): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string | undefined;
            nome: string;
            email: string;
            tipo: string;
            ativo: boolean;
        };
    }>;
    update(id: string, data: any): Promise<import("./entities/user-comum.entity").UserComum>;
    delete(id: string): Promise<{
        message: string;
    }>;
    listarUsuariosComum(clienteMasterIdQuery: string, clienteMasterIdHeader: string, req: any): Promise<{
        statusCode: number;
        message: string;
        data: null;
    } | {
        statusCode: number;
        message: string;
        data: {
            cliente_master: {
                id: string;
                nome: string;
                email: string;
            };
            usuarios: {
                id: string;
                nome: string;
                email: string;
            }[];
        };
    }>;
}
