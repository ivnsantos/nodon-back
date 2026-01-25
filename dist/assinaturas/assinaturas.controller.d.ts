import { AssinaturasService } from './assinaturas.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSimpleSubscriptionDto } from './dto/create-simple-subscription.dto';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UserComumService } from '../users/services/user-comum.service';
export declare class AssinaturasController {
    private assinaturasService;
    private clientesMasterService;
    private userComumService;
    constructor(assinaturasService: AssinaturasService, clientesMasterService: ClientesMasterService, userComumService: UserComumService);
    create(createSubscriptionDto: CreateSubscriptionDto): Promise<import("./dto/subscription-response.dto").SubscriptionResponseDto>;
    createSimple(createSimpleSubscriptionDto: CreateSimpleSubscriptionDto, req: any): Promise<import("./dto/subscription-response.dto").SubscriptionResponseDto>;
    checkPaymentStatus(userId: string): Promise<{
        status: string;
    }>;
    findMy(req: any): Promise<import("./dto/subscription-response.dto").SubscriptionResponseDto | null>;
    getDashboard(req: any, userComumIdHeader?: string, clienteMasterId?: string, usuario?: string): Promise<{
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
    } | {
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
    findOne(id: string): Promise<import("./dto/subscription-response.dto").SubscriptionResponseDto>;
}
