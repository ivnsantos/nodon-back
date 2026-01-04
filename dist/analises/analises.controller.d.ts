import { AnalisesService } from './analises.service';
export declare class AnalisesController {
    private analisesService;
    constructor(analisesService: AnalisesService);
    registrarAnalise(req: any): Promise<{
        message: string;
        analisesFeitas: number;
    }>;
    registrarTokens(req: any, body: {
        tokens: number;
    }): Promise<{
        message: string;
        tokens: number;
        tokensUtilizados: number;
    }>;
    getHistorico(req: any, ano?: string): Promise<import("./entities/historico-mensal.entity").HistoricoMensal[]>;
}
