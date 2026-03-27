import { Repository } from 'typeorm';
import { Plano } from './entities/plano.entity';
export declare class PlanosService {
    private planoRepository;
    constructor(planoRepository: Repository<Plano>);
    create(data: {
        nome: string;
        valorOriginal: number;
        valorPromocional?: number;
        limiteAnalises: number;
        tokenChat?: number;
        descricao?: string;
        isStudentPlan: boolean;
        acesso?: string;
    }): Promise<Plano>;
    findAll(): Promise<Plano[]>;
    findById(id: string): Promise<Plano | null>;
    update(id: string, data: Partial<Plano>): Promise<Plano>;
    delete(id: string): Promise<void>;
    seedPlanos(): Promise<void>;
    updateAllTokenChat(): Promise<{
        message: string;
    }>;
}
