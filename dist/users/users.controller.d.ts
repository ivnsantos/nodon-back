import { UsersService } from './users.service';
import { UserComumService } from './services/user-comum.service';
import { ClientesMasterService } from './clientes-master.service';
export declare class UsersController {
    private usersService;
    private userComumService;
    private clientesMasterService;
    constructor(usersService: UsersService, userComumService: UserComumService, clientesMasterService: ClientesMasterService);
    findAll(req: any): Promise<import("./entities/user-comum.entity").UserComum[]>;
    findOne(id: string, req: any): Promise<import("./entities/user-comum.entity").UserComum>;
    update(id: string, data: any): Promise<import("./entities/user-comum.entity").UserComum>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
