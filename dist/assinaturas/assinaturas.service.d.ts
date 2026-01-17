import { Repository } from 'typeorm';
import { Assinatura } from './entities/assinatura.entity';
import { Cupom } from '../cupons/entities/cupom.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSimpleSubscriptionDto } from './dto/create-simple-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { AsaasService } from './services/asaas.service';
import { PlanosService } from '../planos/planos.service';
import { CuponsService } from '../cupons/cupons.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UsersService } from '../users/users.service';
import { UserBaseService } from '../users/services/user-base.service';
import { UserComumService } from '../users/services/user-comum.service';
import { EmailService } from '../email/email.service';
import { HistoricoMensal } from '../analises/entities/historico-mensal.entity';
import { UserComum } from '../users/entities/user-comum.entity';
export declare class AssinaturasService {
    private readonly assinaturaRepository;
    private readonly cupomRepository;
    private readonly historicoRepository;
    private readonly asaasService;
    private readonly planosService;
    private readonly cuponsService;
    private readonly clientesMasterService;
    private readonly usersService;
    private readonly userBaseService;
    private readonly userComumService;
    private readonly emailService;
    constructor(assinaturaRepository: Repository<Assinatura>, cupomRepository: Repository<Cupom>, historicoRepository: Repository<HistoricoMensal>, asaasService: AsaasService, planosService: PlanosService, cuponsService: CuponsService, clientesMasterService: ClientesMasterService, usersService: UsersService, userBaseService: UserBaseService, userComumService: UserComumService, emailService: EmailService);
    create(createSubscriptionDto: CreateSubscriptionDto): Promise<SubscriptionResponseDto>;
    createSimple(createSimpleSubscriptionDto: CreateSimpleSubscriptionDto, user: {
        id: string;
        email: string;
        tipo: string;
        clienteMasterId?: string | null;
    }): Promise<SubscriptionResponseDto>;
    findByUserId(userId: string): Promise<SubscriptionResponseDto | null>;
    checkFirstPaymentStatus(userId: string): Promise<{
        status: string;
    }>;
    findById(id: string): Promise<SubscriptionResponseDto>;
    getDashboardInfo(clienteMasterId: string, userTipo: string): Promise<{
        clienteMasterId: string;
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
        clienteMasterId: string;
        tokensChat: {
            tokensUtilizados: number;
            tokensUtilizadosMes: number;
            limitePlano: number;
            porcentagemUso: number;
            ultimaAtualizacao: Date;
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
    getDashboardInfoUsuario(clienteMasterId: string, userComum: UserComum): Promise<{
        clienteMaster: {
            id: string;
            nomeEmpresa: string;
            cnpj: string;
            logo: string;
            cor: string;
        };
        clienteMasterId: string;
        usuarioId: string;
        tokensChat: {
            tokensUtilizados: number;
            limitePlano: number;
            porcentagemUso: number;
        };
        analises: {
            analisesRestantes: number;
            limitePlano: number;
            porcentagemUso: number;
        };
        perfil: {
            id: string;
            nome: string;
            email: string;
            cpf: string;
            telefone: string;
            cro: string;
            postalCode: string;
            address: string;
            addressNumber: string;
            complement: string;
            province: string;
            city: string;
            state: string;
            isVerified: boolean;
            ativo: boolean;
            status: "ativo" | "inativo";
        };
        assinatura: {
            status: string;
        } | null;
    }>;
    private toResponseDto;
}
