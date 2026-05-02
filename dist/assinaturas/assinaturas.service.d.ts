import { Repository } from 'typeorm';
import { Assinatura } from './entities/assinatura.entity';
import { Recorrencia } from './entities/recorrencia.entity';
import { Cobranca } from './entities/cobranca.entity';
import { Cupom } from '../cupons/entities/cupom.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSimpleSubscriptionDto } from './dto/create-simple-subscription.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CheckoutCompleteDto } from './dto/checkout-complete.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { PagarMeService } from './services/pagar-me.service';
import { PlanosService } from '../planos/planos.service';
import { CuponsService } from '../cupons/cupons.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UsersService } from '../users/users.service';
import { UserBaseService } from '../users/services/user-base.service';
import { UserComumService } from '../users/services/user-comum.service';
import { HistoricoMensal } from '../analises/entities/historico-mensal.entity';
import { UserComum } from '../users/entities/user-comum.entity';
import { ChatService } from '../chat/chat.service';
import { QueueService } from '../queue/queue.service';
export declare class AssinaturasService {
    private readonly assinaturaRepository;
    private readonly recorrenciaRepository;
    private readonly cobrancaRepository;
    private readonly cupomRepository;
    private readonly historicoRepository;
    private readonly pagarMeService;
    private readonly planosService;
    private readonly cuponsService;
    private readonly clientesMasterService;
    private readonly usersService;
    private readonly userBaseService;
    private readonly userComumService;
    private readonly chatService;
    private readonly queueService;
    constructor(assinaturaRepository: Repository<Assinatura>, recorrenciaRepository: Repository<Recorrencia>, cobrancaRepository: Repository<Cobranca>, cupomRepository: Repository<Cupom>, historicoRepository: Repository<HistoricoMensal>, pagarMeService: PagarMeService, planosService: PlanosService, cuponsService: CuponsService, clientesMasterService: ClientesMasterService, usersService: UsersService, userBaseService: UserBaseService, userComumService: UserComumService, chatService: ChatService, queueService: QueueService);
    create(createSubscriptionDto: CreateSubscriptionDto): Promise<any>;
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
    private atualizarCobrancaComStatusPagarMe;
    checkPaymentStatus(paymentId: string): Promise<any>;
    private criarAssinaturaAPartirDaCobranca;
    findById(id: string): Promise<SubscriptionResponseDto>;
    getDashboardInfo(clienteMasterId: string, userTipo: string): Promise<{
        clienteMasterId: string;
        tokensChat: {
            tokensUtilizados: number;
            tokensUtilizadosMes: number;
            limitePlano: number;
            porcentagemUso: number;
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
            dataFim: string | null;
            proximaRenovacao: string | null;
            nextDueDate: string | null;
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
    getAnalisesInfo(clienteMasterId: string, userId: string, userTipo: string): Promise<{
        limitePlano: number;
        analisesUsadas: number;
        analisesRestantes: number;
        porcentagemUso: number;
        passouDoLimite: boolean;
        aviso: string | null;
        periodo: {
            dataInicio: string | null;
            dataFim: string | null;
        };
    }>;
    private getDataAtualBrasil;
    private calcularProximos2Dias;
    private calcularProximos7Dias;
    private calcularProximoMes;
    private parseDataBrasil;
    private adicionarRecorrencia;
    private removerRecorrencia;
    private resetarTokensUsuario;
    private registrarCobranca;
    private gerenciarRecorrencia;
    private parseNextDueDate;
    createPayment(createPaymentDto: CreatePaymentDto): Promise<any>;
    handleCronProcessarRecorrencias(): Promise<void>;
    processarAssinaturasPending(): Promise<{
        processadas: number;
        sucesso: number;
        falhas: number;
    }>;
    processarRecorrencias(): Promise<{
        processadas: number;
        sucesso: number;
        falhas: number;
        detalhes: Array<{
            assinaturaId: string;
            status: string;
            mensagem: string;
        }>;
    }>;
    processarRecorrenciaIndividual(recorrenciaId: string, assinaturaId: string): Promise<void>;
    createCustomer(createCustomerDto: CreateCustomerDto): Promise<{
        pagarMeCustomerId: string;
        userId: string;
    }>;
    private hasActiveSubscription;
    private preparePagarMeCustomerData;
    private buildPagarMePhones;
    private buildBillingAddressFromAssinatura;
    private ensurePagarMeCustomer;
    private updateExistingUserBase;
    private handleExistingCustomerWithoutSubscription;
    checkoutComplete(checkoutDto: CheckoutCompleteDto): Promise<any>;
    private toResponseDto;
}
