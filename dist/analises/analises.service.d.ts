import { Repository } from 'typeorm';
import { HistoricoMensal } from './entities/historico-mensal.entity';
import { ClientesMasterService } from '../users/clientes-master.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { PlanosService } from '../planos/planos.service';
import { UsersService } from '../users/users.service';
export declare class AnalisesService {
    private historicoRepository;
    private clientesMasterService;
    private assinaturasService;
    private planosService;
    private usersService;
    constructor(historicoRepository: Repository<HistoricoMensal>, clientesMasterService: ClientesMasterService, assinaturasService: AssinaturasService, planosService: PlanosService, usersService: UsersService);
    registrarAnalise(userId: string, userTipo: string): Promise<{
        message: string;
        analisesFeitas: number;
    }>;
    registrarTokens(userId: string, userTipo: string, tokens: number): Promise<{
        message: string;
        tokens: number;
        tokensUtilizados: number;
    }>;
    getHistoricoMensal(clienteMasterId: string, ano?: number): Promise<HistoricoMensal[]>;
    getHistorico(userId: string, userTipo: string, ano?: string): Promise<HistoricoMensal[]>;
}
