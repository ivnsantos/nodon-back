import { PlanosService } from './planos.service';
export declare class PlanosController {
    private planosService;
    constructor(planosService: PlanosService);
    findAll(): Promise<import("./entities/plano.entity").Plano[]>;
    findOne(id: string): Promise<import("./entities/plano.entity").Plano | null>;
    create(data: any): Promise<import("./entities/plano.entity").Plano>;
    update(id: string, data: any): Promise<import("./entities/plano.entity").Plano>;
    delete(id: string): Promise<{
        message: string;
    }>;
    seed(): Promise<{
        message: string;
    }>;
    updateTokenChat(): Promise<{
        message: string;
    }>;
}
