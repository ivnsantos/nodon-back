import { Repository } from 'typeorm';
import { Assinatura } from './entities/assinatura.entity';
import { Cupom } from '../cupons/entities/cupom.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { AsaasService } from './services/asaas.service';
import { PlanosService } from '../planos/planos.service';
import { CuponsService } from '../cupons/cupons.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UsersService } from '../users/users.service';
import { HistoricoMensal } from '../analises/entities/historico-mensal.entity';
export declare class AssinaturasService {
    private readonly assinaturaRepository;
    private readonly cupomRepository;
    private readonly historicoRepository;
    private readonly asaasService;
    private readonly planosService;
    private readonly cuponsService;
    private readonly clientesMasterService;
    private readonly usersService;
    constructor(assinaturaRepository: Repository<Assinatura>, cupomRepository: Repository<Cupom>, historicoRepository: Repository<HistoricoMensal>, asaasService: AsaasService, planosService: PlanosService, cuponsService: CuponsService, clientesMasterService: ClientesMasterService, usersService: UsersService);
    create(createSubscriptionDto: CreateSubscriptionDto): Promise<SubscriptionResponseDto>;
    findByUserId(userId: string): Promise<SubscriptionResponseDto | null>;
    checkFirstPaymentStatus(userId: string): Promise<{
        status: string;
    }>;
    findById(id: string): Promise<SubscriptionResponseDto>;
    getDashboardInfo(userId: string, userTipo: string): Promise<{
        tokensChat: {
            tokensUtilizados: number;
            limitePlano: number;
            porcentagemUso: number;
            tokensUtilizadosMes?: undefined;
            ultimaAtualizacao?: undefined;
        };
        analises: {
            analisesRestantes: number;
            limitePlano: number;
            porcentagemUso: number;
            analisesFeitas?: undefined;
            analisesFeitasMes?: undefined;
        };
        assinatura?: undefined;
        usuarios?: undefined;
        cartao?: undefined;
    } | {
        tokensChat: {
            tokensUtilizados: number;
            tokensUtilizadosMes: number;
            limitePlano: number;
            porcentagemUso: number;
            ultimaAtualizacao: any;
        };
        analises: {
            analisesFeitas: number;
            analisesFeitasMes: number;
            analisesRestantes: number;
            limitePlano: number;
            porcentagemUso: number;
        };
        assinatura: {
            status: string;
            valorMensal: number;
            dataInicio: string | null;
            proximaRenovacao: string | null;
        } | null;
        usuarios: {
            quantidade: number;
        };
        cartao: any;
    }>;
    private toResponseDto;
}
