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
    findAll(req: any): Promise<import("./entities/user-comum.entity").UserComum[]>;
    findOne(id: string, req: any): Promise<import("./entities/user-comum.entity").UserComum>;
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
