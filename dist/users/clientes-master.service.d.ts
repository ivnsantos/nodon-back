import { Repository } from 'typeorm';
import { ClienteMaster } from './entities/cliente-master.entity';
export declare class ClientesMasterService {
    private clienteMasterRepository;
    constructor(clienteMasterRepository: Repository<ClienteMaster>);
    create(data: {
        nome: string;
        email: string;
        password: string;
        telefone?: string;
        cnpj?: string;
    }): Promise<ClienteMaster>;
    findByEmail(email: string): Promise<ClienteMaster | null>;
    findById(id: string): Promise<ClienteMaster | null>;
    findAll(): Promise<ClienteMaster[]>;
    update(id: string, data: Partial<ClienteMaster>): Promise<ClienteMaster>;
    delete(id: string): Promise<void>;
}
