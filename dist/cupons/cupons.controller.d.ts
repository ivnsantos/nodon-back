import { CuponsService } from './cupons.service';
export declare class CuponsController {
    private cuponsService;
    constructor(cuponsService: CuponsService);
    findAll(): Promise<import("./entities/cupom.entity").Cupom[]>;
    findOne(id: string): Promise<import("./entities/cupom.entity").Cupom>;
    findByName(name: string): Promise<import("./entities/cupom.entity").Cupom>;
    create(data: any): Promise<import("./entities/cupom.entity").Cupom>;
    update(id: string, data: any): Promise<import("./entities/cupom.entity").Cupom>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
