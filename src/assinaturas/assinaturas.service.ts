import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
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

@Injectable()
export class AssinaturasService {
  constructor(
    @InjectRepository(Assinatura)
    private readonly assinaturaRepository: Repository<Assinatura>,
    @InjectRepository(Cupom)
    private readonly cupomRepository: Repository<Cupom>,
    @InjectRepository(HistoricoMensal)
    private readonly historicoRepository: Repository<HistoricoMensal>,
    private readonly asaasService: AsaasService,
    private readonly planosService: PlanosService,
    private readonly cuponsService: CuponsService,
    private readonly clientesMasterService: ClientesMasterService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    // 1. Valida cupom se fornecido
    let coupon: Cupom | null = null;
    let couponId: string | null = null;
    if (createSubscriptionDto.couponName) {
      coupon = await this.cuponsService.findByName(createSubscriptionDto.couponName);

      if (!coupon) {
        throw new BadRequestException('CUPOM INVALIDO');
      }

      if (!coupon.active) {
        throw new BadRequestException('CUPOM INVALIDO');
      }

      couponId = coupon.id;
    }

    // 2. Buscar plano
    const plano = await this.planosService.findById(createSubscriptionDto.planoId);
    if (!plano) {
      throw new NotFoundException('Plano não encontrado');
    }

    // Calcular valor com desconto se cupom válido
    let valorFinal = plano.valorPromocional || plano.valorOriginal;
    if (coupon && coupon.active) {
      const desconto = (valorFinal * Number(coupon.discountValue)) / 100;
      valorFinal = valorFinal - desconto;
      if (valorFinal < 0) valorFinal = 0;
    }

    // 3. Criar cliente na ASAAS
    const asaasCustomerId = await this.asaasService.createCustomer({
      name: createSubscriptionDto.name,
      email: createSubscriptionDto.email,
      cpfCnpj: createSubscriptionDto.cpf.replace(/\D/g, ''), // Remove formatação
      phone: createSubscriptionDto.phone.replace(/\D/g, ''), // Remove formatação
      postalCode: createSubscriptionDto.postalCode.replace(/\D/g, ''), // Remove formatação
      address: createSubscriptionDto.address,
      addressNumber: createSubscriptionDto.addressNumber,
      complement: createSubscriptionDto.complement,
      province: createSubscriptionDto.province,
      city: createSubscriptionDto.city,
      state: createSubscriptionDto.state,
    });

    // 4. Tokeniza cartão de crédito se necessário
    let creditCardToken: string | null = null;
    let creditCardNumber: string | null = null;
    let creditCardBrand: string | null = null;

    if (createSubscriptionDto.billingType === 'CREDIT_CARD') {
      if (
        !createSubscriptionDto.creditCardHolderName ||
        !createSubscriptionDto.creditCardNumber ||
        !createSubscriptionDto.creditCardExpiryMonth ||
        !createSubscriptionDto.creditCardExpiryYear ||
        !createSubscriptionDto.creditCardCcv
      ) {
        throw new BadRequestException('Dados do cartão de crédito são obrigatórios');
      }

      try {
        const tokenizedCard = await this.asaasService.tokenizeCreditCard({
          customer: asaasCustomerId,
          creditCard: {
            holderName: createSubscriptionDto.creditCardHolderName,
            number: createSubscriptionDto.creditCardNumber,
            expiryMonth: createSubscriptionDto.creditCardExpiryMonth,
            expiryYear: createSubscriptionDto.creditCardExpiryYear,
            ccv: createSubscriptionDto.creditCardCcv,
          },
          creditCardHolderInfo: {
            name: createSubscriptionDto.name,
            email: createSubscriptionDto.email,
            cpfCnpj: createSubscriptionDto.cpf.replace(/\D/g, ''),
            postalCode: createSubscriptionDto.postalCode.replace(/\D/g, ''),
            addressNumber: createSubscriptionDto.addressNumber,
            addressComplement: createSubscriptionDto.complement || null,
            phone: createSubscriptionDto.phone.replace(/\D/g, ''),
            mobilePhone: createSubscriptionDto.phone.replace(/\D/g, ''),
          },
        });

        creditCardToken = tokenizedCard.creditCardToken;
        creditCardNumber = tokenizedCard.creditCardNumber;
        creditCardBrand = tokenizedCard.creditCardBrand;
      } catch (error: any) {
        throw new BadRequestException(
          `Erro ao tokenizar cartão: ${error.message || 'Erro desconhecido'}`,
        );
      }
    }

    // Calcula a data de vencimento (dia atual)
    const nextDueDate = new Date();
    const nextDueDateString = nextDueDate.toISOString().split('T')[0];

    // 5. Prepara dados da assinatura com desconto se cupom válido
    const subscriptionData: any = {
      customer: asaasCustomerId,
      billingType: createSubscriptionDto.billingType,
      value: valorFinal,
      nextDueDate: nextDueDateString,
      cycle: 'MONTHLY',
      description: `Assinatura ${plano.nome} NODON`,
    };

    // Adiciona desconto se cupom válido
    if (coupon && coupon.active) {
      subscriptionData.discount = {
        value: Number(coupon.discountValue),
        type: 'PERCENTAGE',
      };
    }

    // Adiciona dados do cartão se for cartão de crédito
    if (createSubscriptionDto.billingType === 'CREDIT_CARD') {
      subscriptionData.creditCard = {
        creditCardHolderName: createSubscriptionDto.creditCardHolderName,
        creditCardHolderEmail: createSubscriptionDto.email,
        creditCardHolderCpfCnpj: createSubscriptionDto.cpf.replace(/\D/g, ''),
        creditCardHolderPhone: createSubscriptionDto.phone.replace(/\D/g, ''),
        creditCardHolderPostalCode: createSubscriptionDto.postalCode.replace(/\D/g, ''),
        creditCardHolderAddress: createSubscriptionDto.address,
        creditCardHolderAddressNumber: createSubscriptionDto.addressNumber,
        creditCardHolderAddressComplement: createSubscriptionDto.complement,
        creditCardHolderProvince: createSubscriptionDto.province,
        creditCardHolderCity: createSubscriptionDto.city,
        creditCardHolderState: createSubscriptionDto.state,
      };
    }

    // 6. Cria assinatura na ASAAS
    const asaasSubscription = await this.asaasService.createSubscription(subscriptionData);

    // 7. Criar ClienteMaster no banco
    const hashedPassword = await bcrypt.hash(createSubscriptionDto.password, 10);
    let clienteMaster;
    try {
      // Verifica se já existe um cliente master com este email
      const existingCliente = await this.clientesMasterService.findByEmail(createSubscriptionDto.email);
      if (existingCliente) {
        throw new ConflictException('Já existe um cliente com este email');
      }

      clienteMaster = await this.clientesMasterService.create({
        nome: createSubscriptionDto.name,
        email: createSubscriptionDto.email,
        password: hashedPassword,
        telefone: createSubscriptionDto.phone,
      });
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Erro ao criar cliente master: ${error.message || 'Erro desconhecido'}`,
      );
    }

    // 8. Salva assinatura no banco de dados
    const assinaturaData = {
      userId: clienteMaster.id,
      planoId: createSubscriptionDto.planoId,
      couponId: couponId,
      asaasCustomerId,
      asaasSubscriptionId: asaasSubscription.id,
      name: createSubscriptionDto.name,
      email: createSubscriptionDto.email,
      cpf: createSubscriptionDto.cpf,
      phone: createSubscriptionDto.phone,
      postalCode: createSubscriptionDto.postalCode,
      address: createSubscriptionDto.address,
      addressNumber: createSubscriptionDto.addressNumber,
      complement: createSubscriptionDto.complement,
      province: createSubscriptionDto.province,
      city: createSubscriptionDto.city,
      state: createSubscriptionDto.state,
      value: valorFinal,
      billingType: createSubscriptionDto.billingType,
      creditCardToken: creditCardToken,
      creditCardNumber: creditCardNumber,
      creditCardBrand: creditCardBrand,
      status: 'PENDING',
      asaasResponse: JSON.stringify(asaasSubscription),
    };
    const assinatura = this.assinaturaRepository.create(assinaturaData);

    try {
      const savedSubscription = await this.assinaturaRepository.save(assinatura);
      return this.toResponseDto(savedSubscription);
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Erro ao salvar assinatura no banco de dados: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  async findByUserId(userId: string): Promise<SubscriptionResponseDto | null> {
    const subscription = await this.assinaturaRepository.findOne({
      where: { userId },
      relations: ['plano', 'cupom'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription || subscription.status === 'CANCELLED') {
      return null;
    }

    return this.toResponseDto(subscription);
  }

  async checkFirstPaymentStatus(userId: string): Promise<{ status: string }> {
    // Busca a subscription do usuário
    const subscription = await this.assinaturaRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada para este usuário');
    }

    if (!subscription.asaasSubscriptionId) {
      throw new BadRequestException('Assinatura não possui ID da ASAAS');
    }

    try {
      // Busca os pagamentos da assinatura na ASAAS
      const paymentsResponse = await this.asaasService.getSubscriptionPayments(
        subscription.asaasSubscriptionId,
      );

      // Verifica se há pagamentos
      if (!paymentsResponse.data || paymentsResponse.data.length === 0) {
        return { status: 'NO_PAYMENTS' };
      }

      // Pega o primeiro pagamento (primeira cobrança)
      const firstPayment = paymentsResponse.data[0];
      const paymentStatus = firstPayment.status;

      // Se o status for CONFIRMED, atualiza a subscription para ACTIVE
      if (paymentStatus === 'CONFIRMED') {
        subscription.status = 'ACTIVE';
        await this.assinaturaRepository.save(subscription);
        return { status: 'CONFIRMED' };
      }

      // Caso contrário, retorna apenas o status
      return { status: paymentStatus };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Erro ao verificar status do pagamento: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  async findById(id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.assinaturaRepository.findOne({
      where: { id },
      relations: ['plano', 'cupom'],
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    return this.toResponseDto(subscription);
  }

  async getDashboardInfo(userId: string, userTipo: string) {
    // Determina o ID do cliente master
    const clienteMasterId = userTipo === 'master' ? userId : null;
    
    // Se for usuário, busca o cliente master
    let clienteMaster;
    if (userTipo === 'master') {
      clienteMaster = await this.clientesMasterService.findById(userId);
    } else {
      const user = await this.usersService.findById(userId);
      if (user && user.clienteMasterId) {
        clienteMaster = await this.clientesMasterService.findById(user.clienteMasterId);
      }
    }

    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Busca assinatura diretamente do repositório para ter acesso a todos os campos
    const assinaturaEntity = await this.assinaturaRepository.findOne({
      where: { userId: clienteMaster.id },
      relations: ['plano'],
      order: { createdAt: 'DESC' },
    });
    
    // Busca plano se houver assinatura
    let plano: any = null;
    if (assinaturaEntity && assinaturaEntity.planoId) {
      plano = await this.planosService.findById(assinaturaEntity.planoId);
    }

    // Conta usuários se for master
    let quantidadeUsuarios = 0;
    if (userTipo === 'master') {
      const usuarios = await this.usersService.findAllByClienteMaster(userId);
      quantidadeUsuarios = usuarios.length;
    }

    // Busca histórico do mês atual
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth() + 1;

    const historicoAtual = await this.historicoRepository.findOne({
      where: {
        clienteMasterId: clienteMaster.id,
        ano,
        mes,
      },
    });

    // Calcula total de tokens e análises de todos os históricos
    const todosHistoricos = await this.historicoRepository.find({
      where: { clienteMasterId: clienteMaster.id },
    });

    const tokensChatUsados = todosHistoricos.reduce((sum, h) => sum + Number(h.tokensUtilizados || 0), 0);
    const tokensChatUsadosMes = Number(historicoAtual?.tokensUtilizados || 0);
    const tokensChatLimite = plano ? Number(plano.tokenChat) : 0;
    const porcentagemUsoTokens = tokensChatLimite > 0 
      ? Math.min(100, Math.round((tokensChatUsadosMes / tokensChatLimite) * 100)) 
      : 0;

    // Calcula informações de análises
    const analisesFeitas = todosHistoricos.reduce((sum, h) => sum + Number(h.analisesFeitas || 0), 0);
    const analisesFeitasMes = Number(historicoAtual?.analisesFeitas || 0);
    const analisesLimite = plano ? Number(plano.limiteAnalises) : 0;
    const analisesRestantes = Math.max(0, analisesLimite - analisesFeitasMes);
    const porcentagemUsoAnalises = analisesLimite > 0 
      ? Math.min(100, Math.round((analisesFeitasMes / analisesLimite) * 100)) 
      : 0;

    // Calcula próxima renovação (30 dias após criação da assinatura)
    let proximaRenovacao: string | null = null;
    if (assinaturaEntity && assinaturaEntity.createdAt) {
      const dataInicio = new Date(assinaturaEntity.createdAt);
      const proxima = new Date(dataInicio);
      proxima.setMonth(proxima.getMonth() + 1);
      proximaRenovacao = proxima.toISOString().split('T')[0];
    }

    // Informações do cartão
    let cartao: any = null;
    if (assinaturaEntity && assinaturaEntity.creditCardNumber && assinaturaEntity.creditCardBrand) {
      const ultimos4 = assinaturaEntity.creditCardNumber.slice(-4);
      cartao = {
        bandeira: assinaturaEntity.creditCardBrand,
        ultimos4Digitos: ultimos4,
        numeroMascarado: `• • • • • • • • • • • • ${ultimos4}`,
        // Nota: Data de expiração não está salva, seria necessário adicionar
      };
    }

    // Se não for master, retorna apenas tokens e análises
    if (userTipo !== 'master') {
      return {
        tokensChat: {
          tokensUtilizados: tokensChatUsadosMes,
          limitePlano: tokensChatLimite,
          porcentagemUso: porcentagemUsoTokens,
        },
        analises: {
          analisesRestantes: analisesRestantes,
          limitePlano: analisesLimite,
          porcentagemUso: porcentagemUsoAnalises,
        },
      };
    }

    // Se for master, retorna todas as informações
    return {
      tokensChat: {
        tokensUtilizados: tokensChatUsados,
        tokensUtilizadosMes: tokensChatUsadosMes,
        limitePlano: tokensChatLimite,
        porcentagemUso: porcentagemUsoTokens,
        ultimaAtualizacao: historicoAtual?.updatedAt || clienteMaster.updatedAt,
      },
      analises: {
        analisesFeitas: analisesFeitas,
        analisesFeitasMes: analisesFeitasMes,
        analisesRestantes: analisesRestantes,
        limitePlano: analisesLimite,
        porcentagemUso: porcentagemUsoAnalises,
      },
      assinatura: assinaturaEntity
        ? {
            status: assinaturaEntity.status,
            valorMensal: Number(assinaturaEntity.value),
            dataInicio: assinaturaEntity.createdAt ? assinaturaEntity.createdAt.toISOString().split('T')[0] : null,
            proximaRenovacao: proximaRenovacao,
          }
        : null,
      usuarios: {
        quantidade: quantidadeUsuarios,
      },
      cartao: cartao,
    };
  }


  private toResponseDto(subscription: Assinatura): SubscriptionResponseDto {
    return {
      id: subscription.id,
      userId: subscription.userId,
      asaasCustomerId: subscription.asaasCustomerId,
      asaasSubscriptionId: subscription.asaasSubscriptionId,
      name: subscription.name,
      email: subscription.email,
      cpf: subscription.cpf,
      phone: subscription.phone,
      postalCode: subscription.postalCode,
      address: subscription.address,
      addressNumber: subscription.addressNumber,
      complement: subscription.complement,
      province: subscription.province,
      city: subscription.city,
      state: subscription.state,
      value: Number(subscription.value),
      billingType: subscription.billingType,
      status: subscription.status,
      planoId: subscription.planoId,
      couponId: subscription.couponId,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
