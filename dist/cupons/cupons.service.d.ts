import { Repository } from 'typeorm';
import { Cupom } from './entities/cupom.entity';
export declare class CuponsService {
    private cupomRepository;
    constructor(cupomRepository: Repository<Cupom>);
    create(data: {
        name: string;
        campaignName: string;
        discountValue: number;
        active?: boolean;
    }): Promise<Cupom>;
    findAll(): Promise<Cupom[]>;
    findById(id: string): Promise<Cupom | null>;
    findByName(name: string): Promise<Cupom | null>;
    update(id: string, data: Partial<Cupom>): Promise<Cupom>;
    delete(id: string): Promise<void>;
}
