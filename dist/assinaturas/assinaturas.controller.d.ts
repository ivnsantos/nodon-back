import { AssinaturasService } from './assinaturas.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class AssinaturasController {
    private assinaturasService;
    constructor(assinaturasService: AssinaturasService);
    create(createSubscriptionDto: CreateSubscriptionDto): Promise<import("./dto/subscription-response.dto").SubscriptionResponseDto>;
    checkPaymentStatus(userId: string): Promise<{
        status: string;
    }>;
    findMy(req: any): Promise<import("./dto/subscription-response.dto").SubscriptionResponseDto>;
    getDashboard(req: any): Promise<{
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
            dataInicio: string;
            proximaRenovacao: any;
        };
        usuarios: {
            quantidade: number;
        };
        cartao: any;
    }>;
    findOne(id: string): Promise<import("./dto/subscription-response.dto").SubscriptionResponseDto>;
}
