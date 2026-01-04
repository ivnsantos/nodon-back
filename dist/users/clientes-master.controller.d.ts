import { ClientesMasterService } from './clientes-master.service';
export declare class ClientesMasterController {
    private clientesMasterService;
    constructor(clientesMasterService: ClientesMasterService);
    findAll(): Promise<import("./entities/cliente-master.entity").ClienteMaster[]>;
    findOne(id: string): Promise<import("./entities/cliente-master.entity").ClienteMaster>;
    update(id: string, data: any): Promise<import("./entities/cliente-master.entity").ClienteMaster>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
