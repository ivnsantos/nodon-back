import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
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
import { PagarMeService, PagarMeCreateCustomerDto, PagarMeBillingAddress } from './services/pagar-me.service';
import { PlanosService } from '../planos/planos.service';
import { CuponsService } from '../cupons/cupons.service';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UsersService } from '../users/users.service';
import { UserBaseService } from '../users/services/user-base.service';
import { UserComumService } from '../users/services/user-comum.service';
import { HistoricoMensal } from '../analises/entities/historico-mensal.entity';
import { UserComum } from '../users/entities/user-comum.entity';
import { ChatService } from '../chat/chat.service';
import { newRelicLog } from '../common/utils/newrelic-logger';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class AssinaturasService {
  constructor(
    @InjectRepository(Assinatura)
    private readonly assinaturaRepository: Repository<Assinatura>,
    @InjectRepository(Recorrencia)
    private readonly recorrenciaRepository: Repository<Recorrencia>,
    @InjectRepository(Cobranca)
    private readonly cobrancaRepository: Repository<Cobranca>,
    @InjectRepository(Cupom)
    private readonly cupomRepository: Repository<Cupom>,
    @InjectRepository(HistoricoMensal)
    private readonly historicoRepository: Repository<HistoricoMensal>,
    private readonly pagarMeService: PagarMeService,
    private readonly planosService: PlanosService,
    private readonly cuponsService: CuponsService,
    @Inject(forwardRef(() => ClientesMasterService))
    private readonly clientesMasterService: ClientesMasterService,
    private readonly usersService: UsersService,
    private readonly userBaseService: UserBaseService,
    private readonly userComumService: UserComumService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly queueService: QueueService,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<any> {
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

    // Calcular valor do plano (prioriza valor promocional se existir)
    // Usar nullish coalescing para tratar null/undefined corretamente
    const valorBasePlano = plano.valorPromocional ?? plano.valorOriginal ?? null;
    console.log('💰 Valor do plano:', {
      planoId: plano.id,
      planoNome: plano.nome,
      valorOriginal: plano.valorOriginal,
      valorPromocional: plano.valorPromocional,
      valorBaseUsado: valorBasePlano,
    });

    // Validar se o plano tem valor configurado
    if (!valorBasePlano || valorBasePlano === null || Number(valorBasePlano) <= 0) {
      throw new BadRequestException(
        `O plano "${plano.nome}" não possui valor configurado. Configure valorOriginal ou valorPromocional no plano antes de criar assinaturas.`,
      );
    }

    // Calcular valor final com desconto se cupom válido
    let valorFinal = Number(valorBasePlano);
    if (coupon && coupon.active) {
      const desconto = (valorFinal * Number(coupon.discountValue)) / 100;
      valorFinal = valorFinal - desconto;
      if (valorFinal < 0) valorFinal = 0;
      console.log('🎫 Cupom aplicado:', {
        cupomNome: coupon.name,
        descontoPercentual: coupon.discountValue,
        valorAntes: Number(valorBasePlano),
        valorDepois: valorFinal,
      });
    }

    // Validar valor final antes de enviar
    if (!valorFinal || valorFinal <= 0) {
      throw new BadRequestException(
        'O valor da assinatura deve ser maior que zero. Verifique o valor do plano.',
      );
    }

    console.log('💰 Valor final da assinatura:', valorFinal);

    // 3. Verificar se já existe ClienteMaster com este email
    let clienteMaster;
    let userBase;
    
    try {
      const existingClienteMaster = await this.clientesMasterService.findByEmail(createSubscriptionDto.email);
      
      if (existingClienteMaster) {
        // Cliente já existe, usar o existente
        clienteMaster = existingClienteMaster;
        userBase = await this.userBaseService.findById(existingClienteMaster.userId);
        
        if (!userBase) {
          throw new InternalServerErrorException('UserBase não encontrado para o ClienteMaster existente');
        }

        // Verificar se já existe assinatura ACTIVE para este cliente
        const existingActiveSubscription = await this.assinaturaRepository.findOne({
          where: { 
            userId: clienteMaster.id,
            status: 'ACTIVE',
          },
        });

        if (existingActiveSubscription) {
          throw new BadRequestException('Assinatura ativa. Fale com o Suporte.');
        }
      } else {
        // Cliente não existe, criar novo UserBase e ClienteMaster
        const hashedPassword = await bcrypt.hash(createSubscriptionDto.password, 10);
        
        // Verificar se já existe UserBase com este email (email é único)
        const existingUserBase = await this.userBaseService.findByEmail(createSubscriptionDto.email);
        
        if (existingUserBase) {
          throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
        }

        // Gerar código de verificação (6 dígitos)
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);

        // Criar UserBase com dados pessoais e de endereço
        userBase = await this.userBaseService.create({
          nome: createSubscriptionDto.name,
          email: createSubscriptionDto.email,
          password: hashedPassword,
          cpf: createSubscriptionDto.cpf,
          telefone: createSubscriptionDto.phone,
          postalCode: createSubscriptionDto.postalCode,
          address: createSubscriptionDto.address,
          addressNumber: createSubscriptionDto.addressNumber,
          complement: createSubscriptionDto.complement,
          province: createSubscriptionDto.province,
          city: createSubscriptionDto.city,
          state: createSubscriptionDto.state,
          isVerified: false,
          verificationToken,
          tokenExpiresAt,
        });

      }
    } catch (error: any) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Erro ao criar/obter cliente: ${error.message || 'Erro desconhecido'}`,
      );
    }

    // 4. Criar cliente no Pagar.me
    let pagarMeCustomerId: string;
    try {
      const customerRes = await this.pagarMeService.createCustomer(
        this.preparePagarMeCustomerData(createSubscriptionDto.name, createSubscriptionDto.email, createSubscriptionDto.cpf, createSubscriptionDto.phone, createSubscriptionDto.postalCode, createSubscriptionDto.address, createSubscriptionDto.addressNumber, createSubscriptionDto.complement, createSubscriptionDto.province, createSubscriptionDto.city, createSubscriptionDto.state, undefined),
      );
      pagarMeCustomerId = customerRes.id;
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao criar cliente no Pagar.me: ${error.message || 'Erro desconhecido'}`,
      );
    }

    // 5. Validar token do cartão (front tokeniza e envia)
    let creditCardToken: string | null = null;
    let creditCardNumber: string | null = null;
    let creditCardBrand: string | null = null;

    if (createSubscriptionDto.billingType === 'CREDIT_CARD') {
      if (!createSubscriptionDto.creditCardToken) {
        throw new BadRequestException('Token do cartão de crédito é obrigatório. A tokenização deve ser feita no frontend.');
      }
      creditCardToken = createSubscriptionDto.creditCardToken;
      creditCardNumber = createSubscriptionDto.creditCardNumber || null;
      creditCardBrand = createSubscriptionDto.creditCardBrand || null;
    }

    // 7. Adicionar cartão no Pagar.me (sem cobrança na entrada; recorrência cobra em 5 dias)
    let cardId: string | null = null;

    if (createSubscriptionDto.billingType === 'CREDIT_CARD' && creditCardToken) {
      try {
        const billingAddress: PagarMeBillingAddress = {
          country: 'BR',
          state: createSubscriptionDto.state || '',
          city: createSubscriptionDto.city || '',
          zip_code: (createSubscriptionDto.postalCode || '').replace(/\D/g, ''),
          line_1: [createSubscriptionDto.address, createSubscriptionDto.addressNumber]
            .filter(Boolean)
            .join(', '),
          line_2: createSubscriptionDto.complement || '',
        };

        const cardIdRes = await this.pagarMeService.addCard(
          pagarMeCustomerId,
          creditCardToken,
          billingAddress,
        );
        cardId = cardIdRes.id;
      } catch (error: any) {
        newRelicLog('error', 'Erro ao vincular cartão na criação de assinatura', { error: error.message, customerId: pagarMeCustomerId });
        throw new BadRequestException(`Erro ao vincular cartão: ${error.message || 'Erro desconhecido'}`);
      }
    }

    if (createSubscriptionDto.billingType === 'CREDIT_CARD' && !cardId) {
      throw new BadRequestException('Não foi possível vincular o cartão ao cliente.');
    }

    console.log('✅ cardId:', cardId);

    if (!clienteMaster) {
      clienteMaster = await this.clientesMasterService.create({
        userId: userBase.id,
      });
      if (!clienteMaster) {
        throw new InternalServerErrorException('Erro ao criar ClienteMaster');
      }
    }
    // Primeira cobrança da recorrência em 5 dias
    const nextDueDateString = this.calcularProximos7Dias();
    const nextDueDate = this.parseDataBrasil(nextDueDateString);

    const assinaturaData: Partial<Assinatura> = {
      userId: clienteMaster.id,
      pagarMeCustomerId,
      pagarMeCardId: cardId || null,
      planoId: createSubscriptionDto.planoId,
      couponId: couponId || undefined,
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
      creditCardToken: creditCardToken || '',
      creditCardNumber: creditCardNumber || '',
      creditCardBrand: creditCardBrand || '',
      status: 'ACTIVE',
      nextDueDate: nextDueDate,
    };

    const assinatura = this.assinaturaRepository.create(assinaturaData);

    try {
      const savedSubscription = await this.assinaturaRepository.save(assinatura);
      await this.gerenciarRecorrencia(savedSubscription);

      newRelicLog('info', 'Assinatura criada com sucesso (recorrência em 5 dias)', {
        assinaturaId: savedSubscription.id,
        userId: savedSubscription.userId,
        planoId: savedSubscription.planoId,
        nextDueDate: nextDueDateString,
      });

      return {
        statusCode: 200,
        message: 'Assinatura criada com sucesso. A primeira cobrança será em 5 dias.',
        data: {
          assinatura: this.toResponseDto(savedSubscription),
        },
      };
    } catch (error: any) {
      throw new InternalServerErrorException(`Erro ao salvar assinatura no banco de dados: ${error.message || 'Erro desconhecido'}`);
    }
  }


  async createSimple(
    createSimpleSubscriptionDto: CreateSimpleSubscriptionDto,
    user: { id: string; email: string; tipo: string; clienteMasterId?: string | null },
  ): Promise<SubscriptionResponseDto> {
    // 1. Buscar UserBase e criar NOVO ClienteMaster
    // Sempre cria um novo ClienteMaster para permitir múltiplos consultórios/empresas
    const userBase = await this.userBaseService.findByEmail(user.email);
    if (!userBase) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Sempre criar um novo ClienteMaster (permite múltiplos consultórios)
    const clienteMaster = await this.clientesMasterService.create({
      userId: userBase.id,
      // nomeEmpresa será preenchido depois pelo cliente via API
    });

    // Validar se o usuário tem dados necessários
    if (!userBase.cpf || !userBase.telefone || !userBase.postalCode || !userBase.address) {
      throw new BadRequestException(
        'Dados incompletos. Por favor, complete seu cadastro com CPF, telefone e endereço antes de criar uma assinatura.',
      );
    }

    // 2. Valida cupom se fornecido
    let coupon: Cupom | null = null;
    let couponId: string | null = null;
    if (createSimpleSubscriptionDto.couponName) {
      coupon = await this.cuponsService.findByName(createSimpleSubscriptionDto.couponName);

      if (!coupon) {
        throw new BadRequestException('CUPOM INVALIDO');
      }

      if (!coupon.active) {
        throw new BadRequestException('CUPOM INVALIDO');
      }

      couponId = coupon.id;
    }

    // 3. Buscar plano
    const plano = await this.planosService.findById(createSimpleSubscriptionDto.planoId);
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

    let creditCardToken: string | null = null;
    let creditCardNumber: string | null = null;
    let creditCardBrand: string | null = null;
    let pagarMeCustomerId: string | null = null;
    let pagarMeCardId: string | null = null;

    if (createSimpleSubscriptionDto.billingType === 'CREDIT_CARD') {
      if (!createSimpleSubscriptionDto.creditCardToken) {
        throw new BadRequestException('Token do cartão de crédito é obrigatório. A tokenização deve ser feita no frontend.');
      }
      creditCardToken = createSimpleSubscriptionDto.creditCardToken;
      creditCardNumber = createSimpleSubscriptionDto.creditCardNumber || null;
      creditCardBrand = createSimpleSubscriptionDto.creditCardBrand || null;
      if (!userBase.pagarMeCustomerId) {
        const customerRes = await this.pagarMeService.createCustomer(
          this.preparePagarMeCustomerData(
            userBase.nome || '',
            userBase.email,
            userBase.cpf || '',
            userBase.telefone || '',
            userBase.postalCode || '',
            userBase.address || '',
            userBase.addressNumber || '',
            userBase.complement,
            userBase.province,
            userBase.city,
            userBase.state,
            userBase.id,
            undefined,
          ),
        );
        pagarMeCustomerId = customerRes.id;
        await this.userBaseService.update(userBase.id, { pagarMeCustomerId });
      } else {
        pagarMeCustomerId = userBase.pagarMeCustomerId;
      }

      const billingAddress: PagarMeBillingAddress = {
        country: 'BR',
        state: userBase.state || '',
        city: userBase.city || '',
        zip_code: (userBase.postalCode || '').replace(/\D/g, ''),
        line_1: [userBase.address, userBase.addressNumber].filter(Boolean).join(', '),
        line_2: userBase.complement || '',
      };

      const cardRes = await this.pagarMeService.addCard(
        pagarMeCustomerId,
        creditCardToken,
        billingAddress,
      );
      pagarMeCardId = cardRes.id;
    }

    const nextDueDateString = this.calcularProximos7Dias();
    const nextDueDate = this.parseDataBrasil(nextDueDateString);

    const assinaturaData: Partial<Assinatura> = {
      userId: clienteMaster.id,
      pagarMeCustomerId: pagarMeCustomerId || null,
      pagarMeCardId: pagarMeCardId || null,
      planoId: createSimpleSubscriptionDto.planoId,
      couponId: couponId || undefined,
      name: userBase.nome,
      email: userBase.email,
      cpf: userBase.cpf,
      phone: userBase.telefone,
      postalCode: userBase.postalCode,
      address: userBase.address,
      addressNumber: userBase.addressNumber,
      complement: userBase.complement,
      province: userBase.province,
      city: userBase.city,
      state: userBase.state,
      value: valorFinal,
      billingType: createSimpleSubscriptionDto.billingType,
      creditCardToken: creditCardToken || '',
      creditCardNumber: creditCardNumber || '',
      creditCardBrand: creditCardBrand || '',
      status: 'ACTIVE',
      nextDueDate: nextDueDate,
    };
    const assinatura = this.assinaturaRepository.create(assinaturaData);

    try {
      const savedSubscription = await this.assinaturaRepository.save(assinatura);
      
      // Adiciona na tabela de recorrência (status sempre é ACTIVE ao criar)
      await this.gerenciarRecorrencia(savedSubscription);
      
      // Log customizado para New Relic
      newRelicLog('info', 'Assinatura simples criada com sucesso', {
        assinaturaId: savedSubscription.id,
        userId: savedSubscription.userId,
        planoId: savedSubscription.planoId,
        valor: savedSubscription.value,
        billingType: savedSubscription.billingType,
        status: savedSubscription.status,
        couponId: couponId || null,
      });
      
      return this.toResponseDto(savedSubscription);
    } catch (error: any) {
      // Log customizado para New Relic
      newRelicLog('error', 'Erro ao salvar assinatura simples', {
        error: error.message,
        userId: clienteMaster.id,
        planoId: createSimpleSubscriptionDto.planoId,
      });
      
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
    const subscription = await this.assinaturaRepository.findOne({
      where: { userId },
    });
    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada para este usuário');
    }
    const cobranca = await this.cobrancaRepository.findOne({
      where: { assinaturaId: subscription.id },
      order: { createdAt: 'ASC' },
    });
    if (!cobranca) {
      return { status: 'NO_PAYMENTS' };
    }
    if (cobranca.status === 'paid') {
      if (subscription.status !== 'ACTIVE') {
        subscription.status = 'ACTIVE';
        if (!subscription.nextDueDate) {
          subscription.nextDueDate = this.parseDataBrasil(this.calcularProximoMes());
        }
        await this.assinaturaRepository.save(subscription);
        await this.gerenciarRecorrencia(subscription);
      }
      return { status: 'CONFIRMED' };
    }
    return { status: cobranca.status };
  }

  /**
   * Atualiza a cobrança com os dados mais recentes do Pagar.me (pedido)
   */
  private async atualizarCobrancaComStatusPagarMe(orderId: string): Promise<Cobranca> {
    let orderData: any = null;
    try {
      orderData = await this.pagarMeService.getOrder(orderId);
    } catch (error) {
      console.error('Erro ao buscar pedido no Pagar.me:', error);
      throw new NotFoundException('Pedido não encontrado no Pagar.me');
    }

    const cobranca = await this.cobrancaRepository.findOne({
      where: { pagarMeOrderId: orderId },
    });
    if (!cobranca) {
      throw new NotFoundException('Cobrança não encontrada para este pedido');
    }

    const novoStatus = orderData.status === 'paid' ? 'paid' : orderData.status;
    const statusMudou = cobranca.status !== novoStatus;
    let precisaAtualizar = statusMudou;

    const charge = orderData.charges?.[0];
    if (charge?.paid_at) {
      const novoPaymentDate = this.parseDataBrasil(charge.paid_at.split('T')[0]);
      if (!cobranca.paymentDate || cobranca.paymentDate.getTime() !== novoPaymentDate?.getTime()) {
        cobranca.paymentDate = novoPaymentDate;
        precisaAtualizar = true;
      }
    }

    const novaResposta = JSON.stringify(orderData);
    if (cobranca.pagarMeResponse !== novaResposta) {
      cobranca.pagarMeResponse = novaResposta;
      precisaAtualizar = true;
    }

    if (statusMudou) {
      cobranca.status = novoStatus;
    }
    if (precisaAtualizar) {
      await this.cobrancaRepository.save(cobranca);
    }
    return cobranca;
  }

  /** paymentId aqui é o ID do pedido no Pagar.me (order id) */
  async checkPaymentStatus(paymentId: string): Promise<any> {
    try {
      const cobranca = await this.atualizarCobrancaComStatusPagarMe(paymentId);
      const status = cobranca.status;

      if (status === 'paid' && !cobranca.assinaturaId) {
        // 2.1. Se não tiver userId, buscar dos dados guardados
        if (!cobranca.userId && cobranca.dadosAssinatura) {
          try {
            const dadosAssinatura = JSON.parse(cobranca.dadosAssinatura);
            if (dadosAssinatura.userId) {
              cobranca.userId = dadosAssinatura.userId;
              await this.cobrancaRepository.save(cobranca);
              console.log(`✅ userId vinculado à cobrança ${paymentId}: ${dadosAssinatura.userId}`);
            }
          } catch (error) {
            console.error('Erro ao buscar userId dos dados da assinatura:', error);
          }
        }

        // 2.2. Criar assinatura (só funciona se tiver userId)
        if (cobranca.userId) {
          await this.criarAssinaturaAPartirDaCobranca(cobranca);
          
          // Buscar cobrança atualizada com assinatura vinculada
          const cobrancaAtualizada = await this.cobrancaRepository.findOne({
            where: { id: cobranca.id },
          });

          return {
            statusCode: 200,
            message: 'Pagamento confirmado e assinatura criada com sucesso',
            data: {
              pagamento: {
                id: paymentId,
                status: status,
              },
              assinaturaCriada: true,
              assinaturaId: cobrancaAtualizada?.assinaturaId,
            },
          };
        } else {
          // Status confirmado mas sem userId - não pode criar assinatura ainda
          console.warn(`⚠️ Pagamento ${paymentId} confirmado mas cobrança não possui userId vinculado`);
          return {
            statusCode: 200,
            message: 'Pagamento confirmado, mas não foi possível criar assinatura (falta userId)',
            data: {
              pagamento: {
                id: paymentId,
                status: status,
              },
              assinaturaCriada: false,
              motivo: 'Cobrança não possui userId vinculado',
            },
          };
        }
      }

      // 3. Retornar status atual
      return {
        statusCode: 200,
        message: 'Status do pagamento verificado',
        data: {
          pagamento: {
            id: paymentId,
            status: status,
          },
          assinaturaCriada: !!cobranca.assinaturaId,
          assinaturaId: cobranca.assinaturaId,
        },
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Erro ao verificar status do pagamento: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Cria assinatura a partir dos dados guardados na cobrança
   */
  private async criarAssinaturaAPartirDaCobranca(cobranca: Cobranca): Promise<Assinatura> {
    if (!cobranca.dadosAssinatura || !cobranca.planoId) {
      throw new BadRequestException('Dados insuficientes para criar assinatura');
    }

    // Só cria assinatura se tiver userId vinculado
    if (!cobranca.userId) {
      throw new BadRequestException('Cobrança não possui userId vinculado. Não é possível criar assinatura.');
    }

    const dadosAssinatura = JSON.parse(cobranca.dadosAssinatura);

    const nextDueDateString = this.calcularProximos7Dias();
    const nextDueDate = this.parseDataBrasil(nextDueDateString);

    const assinaturaData: Partial<Assinatura> = {
      userId: cobranca.userId,
      pagarMeCustomerId: cobranca.pagarMeCustomerId,
      pagarMeCardId: dadosAssinatura.pagarMeCardId || null,
      planoId: cobranca.planoId,
      couponId: cobranca.couponId || undefined,
      name: dadosAssinatura.name,
      email: dadosAssinatura.email,
      cpf: dadosAssinatura.cpf,
      phone: dadosAssinatura.phone,
      postalCode: dadosAssinatura.postalCode,
      address: dadosAssinatura.address,
      addressNumber: dadosAssinatura.addressNumber,
      complement: dadosAssinatura.complement,
      province: dadosAssinatura.province,
      city: dadosAssinatura.city,
      state: dadosAssinatura.state,
      value: cobranca.value,
      billingType: dadosAssinatura.billingType,
      creditCardToken: dadosAssinatura.creditCardToken || '',
      creditCardNumber: dadosAssinatura.creditCardNumber || '',
      creditCardBrand: dadosAssinatura.creditCardBrand || '',
      status: 'ACTIVE',
      nextDueDate: nextDueDate,
    };

    const assinatura = this.assinaturaRepository.create(assinaturaData);
    const savedSubscription = await this.assinaturaRepository.save(assinatura);

    // Adiciona na tabela de recorrência
    await this.gerenciarRecorrencia(savedSubscription);

    // Vincula assinatura à cobrança e atualiza userId se necessário
    cobranca.assinaturaId = savedSubscription.id;
    if (!cobranca.userId) {
      cobranca.userId = savedSubscription.userId;
    }
    await this.cobrancaRepository.save(cobranca);
    
    console.log(`✅ Assinatura ${savedSubscription.id} criada e vinculada à cobrança ${cobranca.id}`);

    console.log('✅ Assinatura criada a partir da cobrança:', savedSubscription.id);
    return savedSubscription;
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

  async getDashboardInfo(clienteMasterId: string, userTipo: string) {
    // Busca o ClienteMaster pelo ID fornecido
    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);

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
      const usuarios = await this.usersService.findAllByClienteMaster(clienteMasterId);
      quantidadeUsuarios = usuarios.length;
    }

    // Calcula o período da assinatura usando nextDueDate da ASAAS
    // nextDueDate define o INÍCIO da assinatura, o FIM é 1 mês depois
    const agora = new Date();
    let dataInicioAssinatura: Date | null = null;
    let dataFimAssinatura: Date | null = null;
    let proximaRenovacao: string | null = null;

    if (assinaturaEntity) {
      // Se tem nextDueDate da ASAAS, usa ele como data de INÍCIO do período
      if (assinaturaEntity.nextDueDate) {
        // Usa parseNextDueDate para garantir conversão correta (pode vir como string ou Date)
        dataInicioAssinatura = this.parseNextDueDate(assinaturaEntity.nextDueDate);
        
        if (dataInicioAssinatura) {
          // Data de fim é 1 mês após o início (nextDueDate)
          dataFimAssinatura = new Date(dataInicioAssinatura);
          dataFimAssinatura.setMonth(dataFimAssinatura.getMonth() + 1);
          
          proximaRenovacao = dataFimAssinatura.toISOString().split('T')[0];
        }
      } else if (assinaturaEntity.createdAt) {
        // Fallback: se não tem nextDueDate, calcula baseado em createdAt (comportamento antigo)
        dataInicioAssinatura = new Date(assinaturaEntity.createdAt);
        const diaFaturamento = dataInicioAssinatura.getDate();
        
        const mesesDesdeInicio = Math.floor(
          (agora.getTime() - dataInicioAssinatura.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        
        const proxima = new Date(dataInicioAssinatura);
        proxima.setMonth(proxima.getMonth() + mesesDesdeInicio + 1);
        proxima.setDate(diaFaturamento);
        
        if (proxima <= agora) {
          proxima.setMonth(proxima.getMonth() + 1);
        }
        
        dataFimAssinatura = proxima;
        proximaRenovacao = proxima.toISOString().split('T')[0];
      }
    }

    // Busca histórico do mês atual (calendário)
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

    // Busca tokens do chat: por conversas e por mensagens (usa o maior para refletir uso real)
    const tokensFromConversations = await this.chatService.getTotalTokensForDashboard(
      clienteMaster.id,
      clienteMaster.userId,
    );
    const tokensFromMessages = await this.chatService.getTotalTokensFromMessagesForDashboard(
      clienteMaster.id,
      clienteMaster.userId,
    );
    const tokensChatUsados = Math.max(tokensFromConversations, tokensFromMessages);
    
    // Calcula tokens e análises do período da assinatura (desde criação até próxima renovação)
    let tokensChatUsadosPeriodo = 0;
    let analisesFeitasPeriodo = 0;
    
    if (dataInicioAssinatura) {
      const periodoFromConversations = await this.chatService.getTotalTokensForDashboardInPeriod(
        clienteMaster.id,
        clienteMaster.userId,
        dataInicioAssinatura,
        dataFimAssinatura || agora,
      );
      const periodoFromMessages = await this.chatService.getTotalTokensFromMessagesForDashboardInPeriod(
        clienteMaster.id,
        clienteMaster.userId,
        dataInicioAssinatura,
        dataFimAssinatura || agora,
      );
      tokensChatUsadosPeriodo = Math.max(periodoFromConversations, periodoFromMessages);
      
      // Filtra históricos de análises que estão dentro do período da assinatura
      // Verifica se há interseção entre o período do histórico e o período da assinatura
      const dataFimComparacao = dataFimAssinatura || agora;
      
      for (const h of todosHistoricos) {
        const inicioMesHistorico = new Date(h.ano, h.mes - 1, 1); // Primeiro dia do mês do histórico
        const fimMesHistorico = new Date(h.ano, h.mes, 0, 23, 59, 59, 999); // Último dia do mês do histórico
        
        // Verifica se há interseção entre os períodos:
        // - O início do mês do histórico está dentro do período da assinatura OU
        // - O fim do mês do histórico está dentro do período da assinatura OU
        // - O período da assinatura está completamente dentro do mês do histórico
        const temIntersecao = 
          (inicioMesHistorico >= dataInicioAssinatura && inicioMesHistorico <= dataFimComparacao) ||
          (fimMesHistorico >= dataInicioAssinatura && fimMesHistorico <= dataFimComparacao) ||
          (inicioMesHistorico <= dataInicioAssinatura && fimMesHistorico >= dataFimComparacao);
        
        if (temIntersecao) {
          analisesFeitasPeriodo += Number(h.analisesFeitas || 0);
        }
      }
    } else {
      // Se não tem assinatura, usa total do chat e mês atual do calendário
      tokensChatUsadosPeriodo = tokensChatUsados;
      analisesFeitasPeriodo = Number(historicoAtual?.analisesFeitas || 0);
    }

    const tokensChatLimite = plano ? Number(plano.tokenChat) : 0;
    const porcentagemUsoTokens = tokensChatLimite > 0 
      ? Math.min(100, Math.round((tokensChatUsadosPeriodo / tokensChatLimite) * 100)) 
      : 0;

    // Calcula informações de análises
    const analisesFeitas = todosHistoricos.reduce((sum, h) => sum + Number(h.analisesFeitas || 0), 0);
    // analisesFeitasPeriodo já foi calculado acima
    const analisesLimite = plano ? Number(plano.limiteAnalises) : 0;
    const analisesRestantes = Math.max(0, analisesLimite - analisesFeitasPeriodo);
    const porcentagemUsoAnalises = analisesLimite > 0 
      ? Math.min(100, Math.round((analisesFeitasPeriodo / analisesLimite) * 100)) 
      : 0;

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

    // Se não for master, retorna apenas tokens e análises (com tokensUtilizadosMes para o dashboard)
    if (userTipo !== 'master') {
      return {
        clienteMasterId: clienteMaster.id,
        tokensChat: {
          tokensUtilizados: tokensChatUsadosPeriodo,
          tokensUtilizadosMes: tokensChatUsadosPeriodo,
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
      clienteMasterId: clienteMaster.id,
      tokensChat: {
        tokensUtilizados: tokensChatUsados,
        tokensUtilizadosMes: tokensChatUsadosPeriodo, // Tokens do período da assinatura
        limitePlano: tokensChatLimite,
        porcentagemUso: porcentagemUsoTokens,
        ultimaAtualizacao: historicoAtual?.updatedAt || clienteMaster.updatedAt,
      },
      analises: {
        analisesFeitas: analisesFeitas,
        analisesFeitasMes: analisesFeitasPeriodo,
        analisesRestantes: analisesRestantes,
        limitePlano: analisesLimite,
        porcentagemUso: porcentagemUsoAnalises,
      },
      assinatura: assinaturaEntity
        ? {
            status: assinaturaEntity.status,
            valorMensal: Number(assinaturaEntity.value),
            dataInicio: dataInicioAssinatura ? dataInicioAssinatura.toISOString().split('T')[0] : null,
            dataFim: dataFimAssinatura ? dataFimAssinatura.toISOString().split('T')[0] : null,
            proximaRenovacao: proximaRenovacao,
            nextDueDate: assinaturaEntity.nextDueDate 
              ? (this.parseNextDueDate(assinaturaEntity.nextDueDate)?.toISOString().split('T')[0] || null)
              : null,
          }
        : null,
      usuarios: {
        quantidade: quantidadeUsuarios,
      },
      cartao: cartao,
    };
  }

  async getDashboardInfoUsuario(clienteMasterId: string, userComum: UserComum) {
    // Busca o ClienteMaster pelo ID fornecido com relacionamentos
    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);

    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Buscar UserBase completo para obter dados do perfil
    const userBase = await this.userBaseService.findById(userComum.userId);
    if (!userBase) {
      throw new NotFoundException('Usuário base não encontrado');
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

    // Calcula o período da assinatura usando nextDueDate da ASAAS
    // nextDueDate define o INÍCIO da assinatura, o FIM é 1 mês depois
    const agoraPeriodo = new Date();
    let dataInicioAssinatura: Date | null = null;
    let dataFimAssinatura: Date | null = null;

    if (assinaturaEntity) {
      // Se tem nextDueDate da ASAAS, usa ele como data de INÍCIO do período
      if (assinaturaEntity.nextDueDate) {
        // Usa parseNextDueDate para garantir conversão correta (pode vir como string ou Date)
        dataInicioAssinatura = this.parseNextDueDate(assinaturaEntity.nextDueDate);
        
        if (dataInicioAssinatura) {
          // Data de fim é 1 mês após o início (nextDueDate)
          dataFimAssinatura = new Date(dataInicioAssinatura);
          dataFimAssinatura.setMonth(dataFimAssinatura.getMonth() + 1);
        }
      } else if (assinaturaEntity.createdAt) {
        // Fallback: se não tem nextDueDate, calcula baseado em createdAt
        dataInicioAssinatura = new Date(assinaturaEntity.createdAt);
        const diaFaturamento = dataInicioAssinatura.getDate();
        
        const mesesDesdeInicio = Math.floor(
          (agoraPeriodo.getTime() - dataInicioAssinatura.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        
        const proxima = new Date(dataInicioAssinatura);
        proxima.setMonth(proxima.getMonth() + mesesDesdeInicio + 1);
        proxima.setDate(diaFaturamento);
        
        if (proxima <= agoraPeriodo) {
          proxima.setMonth(proxima.getMonth() + 1);
        }
        
        dataFimAssinatura = proxima;
      }
    }

    // Calcula tokens e análises do período da assinatura
    let tokensChatUsadosPeriodo = 0;
    let analisesFeitasPeriodo = 0;

    if (dataInicioAssinatura) {
      tokensChatUsadosPeriodo = await this.chatService.getTotalTokensByClienteMasterInPeriod(
        clienteMaster.id,
        dataInicioAssinatura,
        dataFimAssinatura || agora
      );

      // Busca todos os históricos e filtra pelo período da assinatura
      const todosHistoricos = await this.historicoRepository.find({
        where: { clienteMasterId: clienteMaster.id },
      });

      // Verifica se há interseção entre o período do histórico e o período da assinatura
      const dataFimComparacao = dataFimAssinatura || agora;
      
      for (const h of todosHistoricos) {
        const inicioMesHistorico = new Date(h.ano, h.mes - 1, 1); // Primeiro dia do mês do histórico
        const fimMesHistorico = new Date(h.ano, h.mes, 0, 23, 59, 59, 999); // Último dia do mês do histórico
        
        // Verifica se há interseção entre os períodos:
        // - O início do mês do histórico está dentro do período da assinatura OU
        // - O fim do mês do histórico está dentro do período da assinatura OU
        // - O período da assinatura está completamente dentro do mês do histórico
        const temIntersecao = 
          (inicioMesHistorico >= dataInicioAssinatura && inicioMesHistorico <= dataFimComparacao) ||
          (fimMesHistorico >= dataInicioAssinatura && fimMesHistorico <= dataFimComparacao) ||
          (inicioMesHistorico <= dataInicioAssinatura && fimMesHistorico >= dataFimComparacao);
        
        if (temIntersecao) {
          analisesFeitasPeriodo += Number(h.analisesFeitas || 0);
        }
      }
    } else {
      // Se não tem assinatura, usa mês atual
      tokensChatUsadosPeriodo = Number(historicoAtual?.tokensUtilizados || 0);
      analisesFeitasPeriodo = Number(historicoAtual?.analisesFeitas || 0);
    }

    const tokensChatLimite = plano ? Number(plano.tokenChat) : 0;
    const porcentagemUsoTokens = tokensChatLimite > 0 
      ? Math.min(100, Math.round((tokensChatUsadosPeriodo / tokensChatLimite) * 100)) 
      : 0;

    // Calcula informações de análises
    const analisesLimite = plano ? Number(plano.limiteAnalises) : 0;
    const analisesRestantes = Math.max(0, analisesLimite - analisesFeitasPeriodo);
    const porcentagemUsoAnalises = analisesLimite > 0 
      ? Math.min(100, Math.round((analisesFeitasPeriodo / analisesLimite) * 100)) 
      : 0;

    // Retorna dados completos para usuário comum
    return {
      clienteMaster: {
        id: clienteMaster.id,
        nomeEmpresa: clienteMaster.nomeEmpresa,
        cnpj: clienteMaster.cnpj,
        logo: clienteMaster.logo,
        cor: clienteMaster.cor,
      },
      clienteMasterId: clienteMaster.id,
      usuarioId: userComum.id,
      tokensChat: {
        tokensUtilizados: tokensChatUsadosPeriodo,
        limitePlano: tokensChatLimite,
        porcentagemUso: porcentagemUsoTokens,
      },
      analises: {
        analisesRestantes: analisesRestantes,
        limitePlano: analisesLimite,
        porcentagemUso: porcentagemUsoAnalises,
      },
      perfil: {
        id: userBase.id,
        nome: userBase.nome,
        email: userBase.email,
        cpf: userBase.cpf,
        telefone: userBase.telefone,
        cro: userBase.cro,
        postalCode: userBase.postalCode,
        address: userBase.address,
        addressNumber: userBase.addressNumber,
        complement: userBase.complement,
        province: userBase.province,
        city: userBase.city,
        state: userBase.state,
        isVerified: userBase.isVerified,
        ativo: userComum.ativo,
        status: userComum.status,
      },
      assinatura: assinaturaEntity ? {
        status: assinaturaEntity.status,
      } : null,
    };
  }


  /**
   * Retorna apenas informações sobre análises do período da assinatura
   */
  async getAnalisesInfo(clienteMasterId: string, userId: string, userTipo: string) {
    // Busca o ClienteMaster pelo ID fornecido
    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);

    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    // Verifica permissão
    if (userTipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some((cm) => cm.id === clienteMasterId);
      if (!temAcesso) {
        throw new BadRequestException('Você não tem permissão para acessar este recurso');
      }
    } else {
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      const temAcesso = usuariosComuns.some((uc) => uc.clienteMasterId === clienteMasterId);
      if (!temAcesso) {
        throw new BadRequestException('Você não tem permissão para acessar este recurso');
      }
    }

    // Busca assinatura
    const assinaturaEntity = await this.assinaturaRepository.findOne({
      where: { userId: clienteMaster.id },
      relations: ['plano'],
      order: { createdAt: 'DESC' },
    });

    // Busca plano
    let plano: any = null;
    if (assinaturaEntity && assinaturaEntity.planoId) {
      plano = await this.planosService.findById(assinaturaEntity.planoId);
    }

    const limitePlano = plano ? Number(plano.limiteAnalises) : 0;

    // Calcula o período da assinatura usando nextDueDate
    const agora = new Date();
    let dataInicioAssinatura: Date | null = null;
    let dataFimAssinatura: Date | null = null;

    if (assinaturaEntity) {
      if (assinaturaEntity.nextDueDate) {
        dataInicioAssinatura = this.parseNextDueDate(assinaturaEntity.nextDueDate);
        if (dataInicioAssinatura) {
          dataFimAssinatura = new Date(dataInicioAssinatura);
          dataFimAssinatura.setMonth(dataFimAssinatura.getMonth() + 1);
        }
      } else if (assinaturaEntity.createdAt) {
        // Fallback
        dataInicioAssinatura = new Date(assinaturaEntity.createdAt);
        const diaFaturamento = dataInicioAssinatura.getDate();
        const mesesDesdeInicio = Math.floor(
          (agora.getTime() - dataInicioAssinatura.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        const proxima = new Date(dataInicioAssinatura);
        proxima.setMonth(proxima.getMonth() + mesesDesdeInicio + 1);
        proxima.setDate(diaFaturamento);
        if (proxima <= agora) {
          proxima.setMonth(proxima.getMonth() + 1);
        }
        dataFimAssinatura = proxima;
      }
    }

    // Busca todos os históricos
    const todosHistoricos = await this.historicoRepository.find({
      where: { clienteMasterId: clienteMaster.id },
    });

    // Calcula análises do período da assinatura
    let analisesFeitasPeriodo = 0;

    if (dataInicioAssinatura) {
      const dataFimComparacao = dataFimAssinatura || agora;

      for (const h of todosHistoricos) {
        const inicioMesHistorico = new Date(h.ano, h.mes - 1, 1);
        const fimMesHistorico = new Date(h.ano, h.mes, 0, 23, 59, 59, 999);

        const temIntersecao =
          (inicioMesHistorico >= dataInicioAssinatura && inicioMesHistorico <= dataFimComparacao) ||
          (fimMesHistorico >= dataInicioAssinatura && fimMesHistorico <= dataFimComparacao) ||
          (inicioMesHistorico <= dataInicioAssinatura && fimMesHistorico >= dataFimComparacao);

        if (temIntersecao) {
          analisesFeitasPeriodo += Number(h.analisesFeitas || 0);
        }
      }
    } else {
      // Se não tem assinatura, usa total de todos os históricos
      analisesFeitasPeriodo = todosHistoricos.reduce((sum, h) => sum + Number(h.analisesFeitas || 0), 0);
    }

    // Verifica se passou do limite
    const passouDoLimite = limitePlano > 0 && analisesFeitasPeriodo > limitePlano;
    const analisesRestantes = Math.max(0, limitePlano - analisesFeitasPeriodo);
    const porcentagemUso = limitePlano > 0
      ? Math.min(100, Math.round((analisesFeitasPeriodo / limitePlano) * 100))
      : 0;

    return {
      limitePlano,
      analisesUsadas: analisesFeitasPeriodo,
      analisesRestantes,
      porcentagemUso,
      passouDoLimite,
      aviso: passouDoLimite
        ? `Limite de análises excedido! Você já utilizou ${analisesFeitasPeriodo} de ${limitePlano} análises permitidas neste período. O limite será renovado na próxima data de faturamento.`
        : null,
      periodo: {
        dataInicio: dataInicioAssinatura ? dataInicioAssinatura.toISOString().split('T')[0] : null,
        dataFim: dataFimAssinatura ? dataFimAssinatura.toISOString().split('T')[0] : null,
      },
    };
  }

  /**
   * Retorna a data atual no fuso horário do Brasil (America/Sao_Paulo)
   * no formato YYYY-MM-DD
   */
  private getDataAtualBrasil(): string {
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const partes = formatter.formatToParts(agora);
    const ano = partes.find(p => p.type === 'year')?.value || '0000';
    const mes = partes.find(p => p.type === 'month')?.value.padStart(2, '0') || '00';
    const dia = partes.find(p => p.type === 'day')?.value.padStart(2, '0') || '00';
    
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Calcula a data de 1 mês à frente a partir da data atual no fuso horário do Brasil
   * Retorna no formato YYYY-MM-DD
   */
  /**
   * Calcula a data de 2 dias à frente (período de teste grátis do Plano Estudante)
   */
  private calcularProximos2Dias(): string {
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const futuros2Dias = new Date(agora);
    futuros2Dias.setDate(futuros2Dias.getDate() + 2);
    
    const partes = formatter.formatToParts(futuros2Dias);
    const ano = partes.find(p => p.type === 'year')?.value || '0000';
    const mes = partes.find(p => p.type === 'month')?.value.padStart(2, '0') || '00';
    const dia = partes.find(p => p.type === 'day')?.value.padStart(2, '0') || '00';
    
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Calcula a data de 5 dias à frente (período de teste grátis dos planos normais)
   * Usado na primeira criação da assinatura
   */
  private calcularProximos7Dias(): string {
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const proximos5Dias = new Date(agora);
    proximos5Dias.setDate(proximos5Dias.getDate() + 5);
    
    const partes = formatter.formatToParts(proximos5Dias);
    const ano = partes.find(p => p.type === 'year')?.value || '0000';
    const mes = partes.find(p => p.type === 'month')?.value.padStart(2, '0') || '00';
    const dia = partes.find(p => p.type === 'day')?.value.padStart(2, '0') || '00';
    
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Calcula a data de 1 mês à frente
   * Usado após o período de teste grátis (após primeira cobrança)
   */
  private calcularProximoMes(): string {
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    // Adiciona 1 mês
    const proximoMes = new Date(agora);
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    
    const partes = formatter.formatToParts(proximoMes);
    const ano = partes.find(p => p.type === 'year')?.value || '0000';
    const mes = partes.find(p => p.type === 'month')?.value.padStart(2, '0') || '00';
    const dia = partes.find(p => p.type === 'day')?.value.padStart(2, '0') || '00';
    
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Converte string de data (YYYY-MM-DD) para Date no fuso horário do Brasil
   */
  private parseDataBrasil(dataString: string): Date {
    const [year, month, day] = dataString.split('-').map(Number);
    // Cria Date em UTC e depois ajusta para o fuso horário do Brasil
    // Usa meio-dia UTC para evitar problemas de timezone
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    return date;
  }

  /**
   * Adiciona assinatura na tabela de recorrência quando status é ACTIVE
   */
  private async adicionarRecorrencia(assinatura: Assinatura): Promise<void> {
    try {
      // Verifica se já existe recorrência para esta assinatura
      const recorrenciaExistente = await this.recorrenciaRepository.findOne({
        where: { assinaturaId: assinatura.id },
      });

      if (recorrenciaExistente) {
        // Atualiza a recorrência existente
        recorrenciaExistente.nextDueDate = assinatura.nextDueDate || this.parseDataBrasil(this.calcularProximoMes());
        recorrenciaExistente.valor = assinatura.value;
        await this.recorrenciaRepository.save(recorrenciaExistente);
      } else {
        // Cria nova recorrência
        const recorrencia = this.recorrenciaRepository.create({
          assinaturaId: assinatura.id,
          userId: assinatura.userId,
          nextDueDate: assinatura.nextDueDate || this.parseDataBrasil(this.calcularProximoMes()),
          valor: assinatura.value,
        });
        await this.recorrenciaRepository.save(recorrencia);
      }
    } catch (error: any) {
      console.error('Erro ao adicionar recorrência:', error.message);
      // Não lança erro para não bloquear o fluxo principal
    }
  }

  /**
   * Remove assinatura da tabela de recorrência quando status é CANCELED ou INACTIVE
   */
  private async removerRecorrencia(assinaturaId: string): Promise<void> {
    try {
      await this.recorrenciaRepository.delete({ assinaturaId });
    } catch (error: any) {
      console.error('Erro ao remover recorrência:', error.message);
      // Não lança erro para não bloquear o fluxo principal
    }
  }

  /**
   * Registra uma cobrança na tabela de cobranças
   * Todas as cobranças são registradas, mesmo as não confirmadas
   * userId pode ser null caso a cobrança ainda não tenha cliente master vinculado
   */
  private async registrarCobranca(data: {
    userId?: string | null;
    pagarMeOrderId: string;
    pagarMeCustomerId: string;
    value: number;
    billingType: string;
    status: string;
    dueDate: Date | null;
    paymentDate: Date | null;
    pagarMeResponse: string;
    assinaturaId?: string | null;
    planoId?: string | null;
    couponId?: string | null;
    dadosAssinatura?: string | null;
  }): Promise<Cobranca> {
    try {
      const cobrancaExistente = await this.cobrancaRepository.findOne({
        where: { pagarMeOrderId: data.pagarMeOrderId },
      });

      if (cobrancaExistente) {
        cobrancaExistente.status = data.status;
        if (data.paymentDate) cobrancaExistente.paymentDate = data.paymentDate;
        if (data.userId && !cobrancaExistente.userId) cobrancaExistente.userId = data.userId;
        if (data.assinaturaId) cobrancaExistente.assinaturaId = data.assinaturaId;
        cobrancaExistente.pagarMeResponse = data.pagarMeResponse;
        if (data.dueDate !== undefined) cobrancaExistente.dueDate = data.dueDate;
        if (data.planoId !== undefined) cobrancaExistente.planoId = data.planoId;
        if (data.couponId !== undefined) cobrancaExistente.couponId = data.couponId;
        if (data.dadosAssinatura !== undefined) cobrancaExistente.dadosAssinatura = data.dadosAssinatura;
        return await this.cobrancaRepository.save(cobrancaExistente);
      }

      const cobranca = this.cobrancaRepository.create({
        userId: data.userId || null,
        pagarMeOrderId: data.pagarMeOrderId,
        pagarMeCustomerId: data.pagarMeCustomerId,
        value: data.value,
        billingType: data.billingType,
        status: data.status,
        dueDate: data.dueDate,
        paymentDate: data.paymentDate,
        pagarMeResponse: data.pagarMeResponse,
        assinaturaId: data.assinaturaId || null,
        planoId: data.planoId || null,
        couponId: data.couponId || null,
        dadosAssinatura: data.dadosAssinatura || null,
      });
      return await this.cobrancaRepository.save(cobranca);
    } catch (error: any) {
      console.error('Erro ao registrar cobrança:', error.message);
      throw error;
    }
  }

  /**
   * Gerencia a tabela de recorrência baseado no status da assinatura
   */
  private async gerenciarRecorrencia(assinatura: Assinatura): Promise<void> {
    if (assinatura.status === 'ACTIVE') {
      await this.adicionarRecorrencia(assinatura);
    } else if (assinatura.status === 'CANCELED' || assinatura.status === 'INACTIVE') {
      await this.removerRecorrencia(assinatura.id);
    }
  }

  /**
   * Converte nextDueDate de string (formato "YYYY-MM-DD") para Date
   * Garante que a conversão seja feita corretamente sem problemas de timezone
   */
  private parseNextDueDate(nextDueDate: string | Date | null | undefined): Date | null {
    if (!nextDueDate) {
      return null;
    }

    // Se já é Date, retorna diretamente
    if (nextDueDate instanceof Date) {
      return isNaN(nextDueDate.getTime()) ? null : nextDueDate;
    }

    // Se é string, converte para Date
    if (typeof nextDueDate === 'string') {
      // Formato esperado: "YYYY-MM-DD"
      // Usa UTC para evitar problemas de timezone
      const [year, month, day] = nextDueDate.split('-').map(Number);
      
      // Valida se os valores são válidos
      if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
        console.warn(`⚠️ Data inválida recebida: ${nextDueDate}`);
        return null;
      }

      // Cria Date em UTC (meio-dia UTC para evitar problemas de timezone)
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
      
      // Valida se a data é válida
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ Data inválida recebida: ${nextDueDate}`);
        return null;
      }

      return date;
    }

    return null;
  }

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
    if (createPaymentDto.creditCard && createPaymentDto.creditCardToken) {
      throw new BadRequestException('Use apenas creditCard ou creditCardToken.');
    }

    const customerId = createPaymentDto.customer;
    let cardId: string;

    // Endereço de cobrança para o cartão (usa assinatura mais recente ou valores padrão)
    const assinaturaParaBilling = await this.assinaturaRepository.findOne({
      where: { pagarMeCustomerId: customerId },
      order: { createdAt: 'DESC' },
    });
    const billingAddress = assinaturaParaBilling
      ? await this.buildBillingAddressFromAssinatura(assinaturaParaBilling)
      : ({
          country: 'BR',
          state: '',
          city: '',
          zip_code: '',
          line_1: '',
          line_2: '',
        } as PagarMeBillingAddress);

    if (createPaymentDto.creditCardToken) {
      const cardRes = await this.pagarMeService.addCard(
        customerId,
        createPaymentDto.creditCardToken,
        billingAddress,
      );
      cardId = cardRes.id;
      const assinatura = await this.assinaturaRepository.findOne({
        where: { pagarMeCustomerId: customerId },
        order: { createdAt: 'DESC' },
      });
      if (assinatura) {
        assinatura.pagarMeCardId = cardRes.id;
        await this.assinaturaRepository.save(assinatura);
      }
    } else {
      const assinatura = await this.assinaturaRepository.findOne({
        where: { pagarMeCustomerId: customerId },
        order: { createdAt: 'DESC' },
      });
      if (!assinatura?.pagarMeCardId) {
        throw new BadRequestException(
          'Envie creditCardToken (token do cartão) ou vincule um cartão antes. O card_id fica na assinatura e é usado para cobranças avulsas.',
        );
      }
      cardId = assinatura.pagarMeCardId;
    }

    // Pagar.me exige amount em centavos e billing_address no payment.
    const amountCentavos = Math.round(createPaymentDto.value * 100);
    const orderCode = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      const order = await this.pagarMeService.createOrder({
        code: orderCode,
        customer_id: customerId,
        items: [
          {
            amount: amountCentavos,
            description: `Cobrança avulsa - R$ ${createPaymentDto.value}`,
            quantity: 1,
            code: orderCode,
          },
        ],
        payments: [
          {
            payment_method: 'credit_card',
            credit_card: {
              card_id: cardId,
              installments: 1,
              operation_type: 'auth_and_capture',
              statement_descriptor: 'NODON',
              card: { billing_address: billingAddress },
            },
          },
        ],
      });
      newRelicLog('info', 'Pagamento avulso Pagar.me criado', {
        orderId: order.id,
        status: order.status,
        valor: createPaymentDto.value,
        customerId,
      });
      return order;
    } catch (error: any) {
      newRelicLog('error', 'Erro ao criar pagamento avulso Pagar.me', {
        error: error.message,
        customerId,
        valor: createPaymentDto.value,
      });
      throw error;
    }
  }

  /**
   * CRON job que roda diariamente às 9h da manhã (horário de Brasília)
   * Usa expressão cron: 0 9 * * * (todo dia às 9h)
   * Timezone: America/Sao_Paulo (horário de Brasília)
   */
  /**
   * CRON job que roda diariamente às 9h da manhã (horário de Brasília)
   * Usa expressão cron: 0 9 * * * (todo dia às 9h)
   * Timezone: America/Sao_Paulo (horário de Brasília)
   */
  @Cron('0 9 * * *', {
    name: 'processar-recorrencias',
    timeZone: 'America/Sao_Paulo',
  })
  async handleCronProcessarRecorrencias() {
    const dataExecucao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`\n${'#'.repeat(80)}`);
    console.log(`⏰ [${dataExecucao}] Executando CRON agendado às 9h da manhã`);
    console.log(`${'#'.repeat(80)}\n`);
    
    // Log customizado para New Relic
    newRelicLog('info', 'CRON: Iniciando processamento de recorrências', {
      cronName: 'processar-recorrencias',
      dataExecucao,
      timeZone: 'America/Sao_Paulo',
    });
    
    try {
      const resultado = await this.processarRecorrencias();
      
      // Log customizado para New Relic
      newRelicLog('info', 'CRON: Processamento de recorrências concluído', {
        cronName: 'processar-recorrencias',
        processadas: resultado.processadas,
        sucesso: resultado.sucesso,
        falhas: resultado.falhas,
      });
    } catch (error: any) {
      console.error(`❌ Erro no CRON automático:`, error.message);
      console.error(`   Stack:`, error.stack);
      
      // Log customizado para New Relic
      newRelicLog('error', 'CRON: Erro no processamento de recorrências', {
        cronName: 'processar-recorrencias',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * CRON job que roda a cada 2 horas para processar assinaturas PENDING
   * Usa expressão cron:  (a cada 2 horas)
   * Timezone: America/Sao_Paulo (horário de Brasília)
   **/
  // @Cron('*/1 * * * *', {
  //   name: 'processar-assinaturas-pending',
  //   timeZone: 'America/Sao_Paulo',
  // })
  // async handleCronProcessarAssinaturasPending() {
  //   const dataExecucao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  //   console.log(`\n${'#'.repeat(80)}`);
  //   console.log(`⏰ [${dataExecucao}] Executando CRON para processar assinaturas PENDING`);
  //   console.log(`${'#'.repeat(80)}\n`);
    
  //   // Log customizado para New Relic
  //   newRelicLog('info', 'CRON: Iniciando processamento de assinaturas PENDING', {
  //     cronName: 'processar-assinaturas-pending',
  //     dataExecucao,
  //     timeZone: 'America/Sao_Paulo',
  //   });
    
  //   try {
  //     const resultado = await this.processarAssinaturasPending();
      
  //     // Log customizado para New Relic
  //     newRelicLog('info', 'CRON: Processamento de assinaturas PENDING concluído', {
  //       cronName: 'processar-assinaturas-pending',
  //       processadas: resultado.processadas,
  //       sucesso: resultado.sucesso,
  //       falhas: resultado.falhas,
  //     });
  //   } catch (error: any) {
  //     console.error(`❌ Erro no CRON de assinaturas PENDING:`, error.message);
  //     console.error(`   Stack:`, error.stack);
      
  //     // Log customizado para New Relic
  //     newRelicLog('error', 'CRON: Erro ao processar assinaturas PENDING', {
  //       cronName: 'processar-assinaturas-pending',
  //       error: error.message,
  //       stack: error.stack,
  //     });
  //   }
  // }

  /**
   * Processa assinaturas com status PENDING
   * Tenta cobrar novamente e, em caso de sucesso, cria nova recorrência para 30 dias
   */
  async processarAssinaturasPending(): Promise<{
    processadas: number;
    sucesso: number;
    falhas: number;
  }> {
    console.log('🔄 Iniciando processamento de assinaturas PENDING...');
    
    // Buscar assinaturas com status PENDING
    const assinaturasPending = await this.assinaturaRepository.find({
      where: { status: 'PENDING' },
      relations: ['clienteMaster', 'plano'],
    });

    console.log(`📊 Encontradas ${assinaturasPending.length} assinaturas PENDING para processar`);

    if (assinaturasPending.length === 0) {
      return {
        processadas: 0,
        sucesso: 0,
        falhas: 0,
      };
    }

    let processadas = 0;
    let sucesso = 0;
    let falhas = 0;

    for (const assinatura of assinaturasPending) {
      try {
        processadas++;
        console.log(`\n⚡ Processando assinatura ${assinatura.id} - Cliente: ${assinatura.clienteMaster?.nomeEmpresa || 'N/A'}`);

        // Buscar informações do cliente master para cobrança
        const clienteMaster = assinatura.clienteMaster;
        if (!clienteMaster) {
          console.log(`❌ Assinatura ${assinatura.id} não possui cliente master vinculado`);
          falhas++;
          continue;
        }

        // Buscar informações do plano
        const plano = await this.planosService.findById(assinatura.planoId);
        if (!plano) {
          console.log(`❌ Plano ${assinatura.planoId} não encontrado para assinatura ${assinatura.id}`);
          falhas++;
          continue;
        }

        // Pagar.me exige pelo menos um telefone no customer para criar pedido
        let phoneForGateway = assinatura.phone || '';
        if (!phoneForGateway && assinatura.userId) {
          const cm = await this.clientesMasterService.findById(assinatura.userId);
          if (cm?.userId) {
            const ub = await this.userBaseService.findById(cm.userId);
            if (ub?.telefone) phoneForGateway = ub.telefone;
          }
        }

        console.log(`💳 Tentando cobrar R$ ${assinatura.value}`);
        
        // Pagar.me: amount em centavos. assinatura.value em reais.
        const amountCentavos = Math.round(Number(assinatura.value) * 100);
        const orderCode = `pending_${assinatura.id}_${Date.now()}`;

        const billingAddress = await this.buildBillingAddressFromAssinatura(assinatura);

        const orderResult = await this.pagarMeService.createOrder({
          code: orderCode,
          customer_id: assinatura.pagarMeCustomerId || '',
          items: [{
            amount: amountCentavos,
            description: `Assinatura NODON ${plano.nome}`,
            quantity: 1,
            code: orderCode,
          }],
          payments: [{
            payment_method: 'credit_card',
            credit_card: {
              card_id: assinatura.pagarMeCardId || '',
              installments: 1,
              operation_type: 'auth_and_capture',
              statement_descriptor: 'NODON',
              card: { billing_address: billingAddress },
            },
          }],
        });

        if (orderResult.status === 'paid') {
          console.log(`✅ SUCESSO: Cobrança confirmada para assinatura ${assinatura.id}`);
          
          // Atualizar status da assinatura para ACTIVE
         
          
          // Criar nova recorrência para 30 dias
          const proximaData = new Date();
          proximaData.setDate(proximaData.getDate() + 30);
          assinatura.status = 'ACTIVE';

          assinatura.nextDueDate = proximaData
          await this.assinaturaRepository.save(assinatura);
          
          const novaRecorrencia = new Recorrencia();
          novaRecorrencia.assinaturaId = assinatura.id;
          novaRecorrencia.nextDueDate = proximaData;
          novaRecorrencia.valor = assinatura.value;
          
          await this.recorrenciaRepository.save(novaRecorrencia);
          
          console.log(`📅 Nova recorrência criada para ${proximaData.toISOString().split('T')[0]}`);
          sucesso++;
          
        } else {
          console.log(`❌ Falha na cobrança: ${orderResult.status}`);
          if (orderResult.closed && orderResult.status === 'failed') {
            console.log(`   Erro: Falha no pagamento`);
          }
          falhas++;
        }

      } catch (error: any) {
        console.error(`❌ Erro ao processar assinatura ${assinatura.id}:`, error.message);
        if (error.stack) {
          console.error(`   Stack:`, error.stack);
        }
        falhas++;
      }
    }

    console.log(`\n✅ Processamento PENDING concluído:`);
    console.log(`   Processadas: ${processadas}`);
    console.log(`   Sucesso: ${sucesso}`);
    console.log(`   Falhas: ${falhas}`);

    // Log customizado para New Relic
    newRelicLog('info', 'Processamento de assinaturas PENDING concluído', {
      totalAssinaturas: assinaturasPending.length,
      processadas,
      sucesso,
      falhas,
    });

    return {
      processadas,
      sucesso,
      falhas,
    };
  }

  /**
   * Processa recorrências que vencem hoje
   * Agora usa BullMQ para processar jobs de forma assíncrona
   * CRON job que roda diariamente para cobrar assinaturas
   */
  async processarRecorrencias(): Promise<{
    processadas: number;
    sucesso: number;
    falhas: number;
    detalhes: Array<{
      assinaturaId: string;
      status: string;
      mensagem: string;
    }>;
  }> {
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔄 [${timestamp}] CRON: Iniciando processamento de recorrências`);
    console.log(`${'='.repeat(80)}`);

    const hoje = this.getDataAtualBrasil(); // Formato: YYYY-MM-DD
    const hojeDate = this.parseDataBrasil(hoje);

    console.log(`📅 Data de hoje (Brasil): ${hoje}`);
    console.log(`📅 Data de hoje (Date object): ${hojeDate}`);

    // Buscar todas as recorrências que vencem hoje
    // Compara apenas a data (ignora hora/minuto/segundo)
    console.log(`🔍 Buscando recorrências com next_due_date = ${hoje}...`);
    
    const recorrencias = await this.recorrenciaRepository
      .createQueryBuilder('recorrencia')
      .leftJoinAndSelect('recorrencia.assinatura', 'assinatura')
      .where('recorrencia.next_due_date = :hoje', { hoje: hojeDate })
      .getMany();

    console.log(`📊 Total de recorrências encontradas: ${recorrencias.length}`);
    
    if (recorrencias.length > 0) {
      console.log(`📋 IDs das recorrências encontradas:`);
      recorrencias.forEach((r, index) => {
        console.log(`   ${index + 1}. Recorrência ID: ${r.id} | Assinatura ID: ${r.assinaturaId} | Next Due Date: ${r.nextDueDate} | Valor: R$ ${r.valor}`);
      });
    } else {
      console.log(`ℹ️  Nenhuma recorrência encontrada para processar hoje.`);
      return {
        processadas: 0,
        sucesso: 0,
        falhas: 0,
        detalhes: [],
      };
    }

    let jobsAdicionados = 0;
    let jobsPulados = 0;

    // Adicionar cada recorrência como um job na fila
    for (let i = 0; i < recorrencias.length; i++) {
      const recorrencia = recorrencias[i];
      const assinatura = recorrencia.assinatura;

      console.log(`\n${'-'.repeat(80)}`);
      console.log(`🔄 [${i + 1}/${recorrencias.length}] Preparando recorrência ID: ${recorrencia.id}`);
      console.log(`   Assinatura ID: ${recorrencia.assinaturaId}`);
      console.log(`   Valor: R$ ${recorrencia.valor}`);
      console.log(`   Next Due Date: ${recorrencia.nextDueDate}`);

      if (!assinatura) {
        console.error(`❌ [${i + 1}/${recorrencias.length}] Assinatura não encontrada para recorrência ${recorrencia.id}`);
        jobsPulados++;
        continue;
      }

      console.log(`   Assinatura encontrada: ${assinatura.id}`);
      console.log(`   Status da assinatura: ${assinatura.status}`);
      console.log(`   Customer ID (Pagar.me): ${assinatura.pagarMeCustomerId || 'NÃO ENCONTRADO'}`);
      console.log(`   Card ID: ${assinatura.pagarMeCardId ? 'PRESENTE' : 'NÃO ENCONTRADO'}`);

      if (assinatura.status !== 'ACTIVE') {
        console.log(`⚠️ [${i + 1}/${recorrencias.length}] Assinatura ${assinatura.id} não está ativa. Removendo da recorrência.`);
        await this.removerRecorrencia(assinatura.id);
        jobsPulados++;
        continue;
      }

      if (!assinatura.pagarMeCardId || !assinatura.pagarMeCustomerId) {
        console.error(`❌ [${i + 1}/${recorrencias.length}] Assinatura ${assinatura.id} sem pagarMeCardId ou pagarMeCustomerId`);
        jobsPulados++;
        continue;
      }

      // ⚠️ VALIDAÇÃO ANTI-DUPLICAÇÃO: Verificar se já existe cobrança para esta assinatura na data de hoje
      console.log(`🔍 [${i + 1}/${recorrencias.length}] Verificando se já existe cobrança para esta assinatura na data de hoje...`);
      const cobrancaExistente = await this.cobrancaRepository
        .createQueryBuilder('cobranca')
        .where('cobranca.assinatura_id = :assinaturaId', { assinaturaId: assinatura.id })
        .andWhere('cobranca.due_date = :hoje', { hoje: hojeDate })
        .getOne();

      if (cobrancaExistente) {
        console.log(`⚠️ [${i + 1}/${recorrencias.length}] JÁ EXISTE cobrança para assinatura ${assinatura.id} na data ${hoje}`);
        console.log(`   Cobrança ID: ${cobrancaExistente.id}`);
        console.log(`   Status: ${cobrancaExistente.status}`);
        console.log(`   Pagar.me Order ID: ${cobrancaExistente.pagarMeOrderId}`);
        console.log(`   ⏭️ Pulando esta recorrência para evitar cobrança duplicada`);
        
        // Log customizado para New Relic
        newRelicLog('warn', 'Recorrência pulada - cobrança já existe', {
          assinaturaId: assinatura.id,
          recorrenciaId: recorrencia.id,
          cobrancaExistenteId: cobrancaExistente.id,
          cobrancaStatus: cobrancaExistente.status,
          data: hoje,
          motivo: 'Cobrança duplicada evitada',
        });
        
        jobsPulados++;
        continue; // Pula para próxima recorrência
      }

      console.log(`✅ [${i + 1}/${recorrencias.length}] Nenhuma cobrança encontrada para esta data. Adicionando job à fila...`);

      try {
        // Adicionar job na fila (processamento assíncrono)
        await this.queueService.adicionarJobProcessarRecorrencia(
          recorrencia.id,
          assinatura.id,
        );

        jobsAdicionados++;
        console.log(`📋 Job adicionado à fila para recorrência ${recorrencia.id} - Assinatura: ${assinatura.id}`);
      } catch (error: any) {
        jobsPulados++;
        console.error(`❌ Erro ao adicionar job para recorrência ${recorrencia.id}: ${error.message}`);
        if (error.stack) {
          console.error(`   Stack: ${error.stack}`);
        }
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESUMO DO PROCESSAMENTO:`);
    console.log(`   Total encontradas: ${recorrencias.length}`);
    console.log(`   Jobs adicionados: ${jobsAdicionados}`);
    console.log(`   Jobs pulados: ${jobsPulados}`);
    console.log(`📊 Os jobs serão processados assincronamente pelo worker`);
    console.log(`${'='.repeat(80)}\n`);

    return {
      processadas: recorrencias.length,
      sucesso: 0, // Será atualizado pelos workers
      falhas: 0, // Será atualizado pelos workers
      detalhes: [], // Será atualizado pelos workers
    };
  }

  /**
   * Processa uma recorrência individual
   * Este método é chamado pelo worker do BullMQ
   */
  async processarRecorrenciaIndividual(
    recorrenciaId: string,
    assinaturaId: string,
  ): Promise<void> {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`🔄 Processando recorrência individual ID: ${recorrenciaId}`);
    console.log(`   Assinatura ID: ${assinaturaId}`);

    newRelicLog('info', `Processando recorrência individual ID: ${recorrenciaId} - Assinatura: ${assinaturaId}`);
    // Buscar recorrência e assinatura
    const recorrencia = await this.recorrenciaRepository.findOne({
      where: { id: recorrenciaId },
      relations: ['assinatura'],
    });

    if (!recorrencia) {
      throw new Error(`Recorrência ${recorrenciaId} não encontrada`);
    }

    const assinatura = recorrencia.assinatura;

    if (!assinatura) {
      throw new Error(`Assinatura não encontrada para recorrência ${recorrenciaId}`);
    }

    if (assinatura.id !== assinaturaId) {
      throw new Error(`Assinatura ID não corresponde: esperado ${assinaturaId}, encontrado ${assinatura.id}`);
    }

    console.log(`   Assinatura encontrada: ${assinatura.id}`);
    console.log(`   Status da assinatura: ${assinatura.status}`);
    console.log(`   Valor: R$ ${recorrencia.valor}`);

    // Verificar se assinatura está ativa
    if (assinatura.status !== 'ACTIVE') {
      console.log(`⚠️ Assinatura ${assinatura.id} não está ativa (status: ${assinatura.status}). Removendo da recorrência.`);
      await this.removerRecorrencia(assinatura.id);
      throw new Error(`Assinatura não está ativa (status: ${assinatura.status})`);
    }

    if (!assinatura.pagarMeCardId || !assinatura.pagarMeCustomerId) {
      throw new Error('Dados insuficientes para cobrança (falta pagarMeCardId ou pagarMeCustomerId)');
    }

    const hoje = this.getDataAtualBrasil(); // Formato: YYYY-MM-DD
    const hojeDate = this.parseDataBrasil(hoje);

    // ⚠️ VALIDAÇÃO ANTI-DUPLICAÇÃO COM LOCK: Usar transação com lock pessimista
    // Isso previne race condition quando múltiplos workers processam a mesma recorrência simultaneamente
    console.log(`🔍 Verificando se já existe cobrança para esta assinatura na data de hoje (com lock)...`);
    
    const queryRunner = this.cobrancaRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock pessimista: bloqueia a linha da assinatura até o fim da transação
      const cobrancaExistente = await queryRunner.manager
        .createQueryBuilder(Cobranca, 'cobranca')
        .setLock('pessimistic_write')
        .where('cobranca.assinatura_id = :assinaturaId', { assinaturaId: assinatura.id })
        .andWhere('cobranca.due_date = :hoje', { hoje: hojeDate })
        .getOne();

      if (cobrancaExistente) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        
        console.log(`⚠️ JÁ EXISTE cobrança para assinatura ${assinatura.id} na data ${hoje}`);
        console.log(`   Cobrança ID: ${cobrancaExistente.id}`);
        console.log(`   Status: ${cobrancaExistente.status}`);
        console.log(`   Pagar.me Order ID: ${cobrancaExistente.pagarMeOrderId}`);
        console.log(`   ⏭️ Pulando esta recorrência para evitar cobrança duplicada`);
        
        // Log customizado para New Relic
        newRelicLog('warn', 'Recorrência pulada - cobrança já existe', {
          assinaturaId: assinatura.id,
          recorrenciaId: recorrencia.id,
          cobrancaExistenteId: cobrancaExistente.id,
          cobrancaStatus: cobrancaExistente.status,
          data: hoje,
          motivo: 'Cobrança duplicada evitada (com lock)',
        });
        
        throw new Error(`Cobrança já existe para esta data. Status: ${cobrancaExistente.status}`);
      }

      console.log(`✅ Nenhuma cobrança encontrada para esta data. Prosseguindo com lock ativo...`);
      
      // Commit da transação será feito após criar a cobrança
      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw error;
    }

    try {
      // Pagar.me exige pelo menos um telefone no customer para criar pedido
      let phoneForGateway = assinatura.phone || '';
      if (!phoneForGateway && assinatura.userId) {
        const cm = await this.clientesMasterService.findById(assinatura.userId);
        if (cm?.userId) {
          const ub = await this.userBaseService.findById(cm.userId);
          if (ub?.telefone) phoneForGateway = ub.telefone;
        }
      }

      console.log(`💳 Criando cobrança no Pagar.me...`);
      // Pagar.me: amount em centavos. recorrencia.valor em reais.
      const amountCentavos = Math.round(Number(recorrencia.valor) * 100);
      const orderCode = `rec_${recorrencia.id}_${Date.now()}`;

      const billingAddress = await this.buildBillingAddressFromAssinatura(assinatura);
      newRelicLog('info', 'Criando order no Pagar.me', {
        orderCode,
        customer_id: assinatura.pagarMeCustomerId,
        items: [
          {
            amount: amountCentavos,
            description: `Recorrência assinatura - NODON`,
            quantity: 1,
            code: orderCode,
          },
        ],
        payments: [
          {
            payment_method: 'credit_card',
            credit_card: {
              card_id: assinatura.pagarMeCardId,
              installments: 1,
              operation_type: 'auth_and_capture',
              statement_descriptor: 'NODON',
            },
          },
        ],
        billing: billingAddress,
      });
      const orderResult = await this.pagarMeService.createOrder({
        code: orderCode,
        customer_id: assinatura.pagarMeCustomerId,
        items: [
          {
            amount: amountCentavos,
            description: `Recorrência assinatura - NODON`,
            quantity: 1,
            code: orderCode,
          },
        ],
        payments: [
          {
            payment_method: 'credit_card',
            credit_card: {
              card_id: assinatura.pagarMeCardId,
              installments: 1,
              operation_type: 'auth_and_capture',
              statement_descriptor: 'NODON',
              card: { billing_address: billingAddress },
            },
          },
        ],
      });
      newRelicLog('info', 'Order criada no Pagar.me', {
        orderResult,
      });

      await this.registrarCobranca({
        userId: assinatura.userId,
        pagarMeOrderId: orderResult.id,
        pagarMeCustomerId: assinatura.pagarMeCustomerId,
        value: Number(recorrencia.valor),
        billingType: assinatura.billingType || 'CREDIT_CARD',
        status: orderResult.status,
        dueDate: hojeDate,
        paymentDate: orderResult.status === 'paid' && orderResult.charges?.[0]?.paid_at
          ? this.parseDataBrasil(orderResult.charges[0].paid_at.split('T')[0])
          : null,
        pagarMeResponse: JSON.stringify(orderResult),
        assinaturaId: null,
        planoId: assinatura.planoId || null,
        couponId: assinatura.couponId || null,
      });

      if (orderResult.status === 'paid') {
        const proximoMes = this.calcularProximoMes();
        const proximoMesDate = this.parseDataBrasil(proximoMes);
        assinatura.nextDueDate = proximoMesDate;
        await this.assinaturaRepository.save(assinatura);
        recorrencia.nextDueDate = proximoMesDate;
        recorrencia.valor = assinatura.value;
        await this.recorrenciaRepository.save(recorrencia);

        const cobranca = await this.cobrancaRepository.findOne({
          where: { pagarMeOrderId: orderResult.id },
        });
        if (cobranca) {
          cobranca.assinaturaId = assinatura.id;
          await this.cobrancaRepository.save(cobranca);
          newRelicLog('info', 'Recorrência Pagar.me processada com sucesso', {
            assinaturaId: assinatura.id,
            recorrenciaId: recorrencia.id,
            orderId: orderResult.id,
            valor: Number(recorrencia.valor),
            proximaCobranca: proximoMes,
          });
        }
        newRelicLog('info', 'Cobrança confirmada para assinatura', {
          assinaturaId: assinatura.id,
          proximaCobranca: proximoMes,
        });
        console.log(`✅ SUCESSO: Cobrança confirmada para assinatura ${assinatura.id}. Próxima: ${proximoMes}`);
      } else {
        console.log(`❌ Pagamento não aprovado. Status: ${orderResult.status}`);
        console.log(`   Colocando assinatura como PENDING e removendo da recorrência...`);
        
        // ❌ Pagamento falhou - colocar assinatura como PENDING e remover da recorrência
        assinatura.status = 'PENDING';
        await this.assinaturaRepository.save(assinatura);
        console.log(`   ✅ Assinatura marcada como PENDING`);

        // Remover da recorrência
        await this.removerRecorrencia(assinatura.id);
        console.log(`   ✅ Assinatura removida da recorrência`);

        const cobranca = await this.cobrancaRepository.findOne({
          where: { pagarMeOrderId: orderResult.id },
        });
        if (cobranca) {
          cobranca.status = 'failed';
          await this.cobrancaRepository.save(cobranca);
        }
        console.error(`❌ FALHA: Cobrança falhou para assinatura ${assinatura.id}. Status: ${orderResult.status}`);
        newRelicLog('warn', 'Recorrência falhou - pagamento não confirmado', {
          assinaturaId: assinatura.id,
          recorrenciaId: recorrencia.id,
          orderId: orderResult.id,
          valor: Number(recorrencia.valor),
          status: orderResult.status,
        });
        throw new Error(`Pagamento não confirmado. Status: ${orderResult.status}`);
      }
    } catch (error: any) {
      // ❌ Erro ao processar cobrança
      console.error(`\n❌ ERRO ao processar cobrança para assinatura ${assinatura.id}:`);
      console.error(`   Mensagem: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      console.log(`   Colocando assinatura como PENDING e removendo da recorrência...`);

      // Colocar assinatura como PENDING
      assinatura.status = 'PENDING';
      await this.assinaturaRepository.save(assinatura);
      console.log(`   ✅ Assinatura marcada como PENDING`);

      // Remover da recorrência
      await this.removerRecorrencia(assinatura.id);
      console.log(`   ✅ Assinatura removida da recorrência`);

      // Log customizado para New Relic
      newRelicLog('error', 'Erro ao processar recorrência', {
        assinaturaId: assinatura.id,
        recorrenciaId: recorrencia.id,
        error: error.message,
        stack: error.stack,
      });

      // Re-throw para que o BullMQ possa fazer retry
      throw error;
    }
  }

  /**
   * Cria um customer no Pagar.me e também grava no banco local (UserBase e ClienteMaster).
   * Validações:
   * - Se email E telefone já existem E tem assinatura ACTIVE ou PENDING → erro
   * - Se email E telefone já existem MAS não tem assinatura → erro (não pode cadastrar)
   * - Se cliente já existe mas não tem assinatura → retorna pagarMeCustomerId da base
   */
  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<{ 
    pagarMeCustomerId: string;
    userId: string;
  }> {
    newRelicLog('info', 'Iniciando criação de customer', {
      email: createCustomerDto.email,
      phone: createCustomerDto.phone,
      name: createCustomerDto.name,
    });

    try {
      const telefoneNormalizado = createCustomerDto.phone.replace(/\D/g, '');
      const existingUserBaseByEmail = await this.userBaseService.findByEmail(createCustomerDto.email);
      const existingUserBaseByPhone = await this.userBaseService.findByTelefone(telefoneNormalizado);
      const mesmoUsuario = existingUserBaseByEmail && existingUserBaseByPhone && 
                          existingUserBaseByEmail.id === existingUserBaseByPhone.id;
      
      if (mesmoUsuario) {
        const userBase = existingUserBaseByEmail;
        const clientesMaster = await this.clientesMasterService.findByUserId(userBase.id);
        const clienteMaster = clientesMaster.length > 0 ? clientesMaster[0] : null;
        
        if (clienteMaster) {
          const hasSubscription = await this.hasActiveSubscription(clienteMaster.id);
          if (hasSubscription) {
            newRelicLog('error', 'Customer já existe com assinatura ativa - Não pode cadastrar novamente', {
              email: createCustomerDto.email,
              phone: createCustomerDto.phone,
              userId: userBase.id,
            });
            throw new BadRequestException(
              'Já existe uma assinatura ativa ou pendente para este email e telefone. Não é possível cadastrar novamente.'
            );
          }
        }
        
        // Não tem assinatura, pode atualizar
        return await this.handleExistingCustomerWithoutSubscription(
          userBase,
          createCustomerDto,
          telefoneNormalizado,
        );
      }
      
      // 4. Se email OU telefone já existem separadamente
      if (existingUserBaseByEmail && !mesmoUsuario) {
        const clientesMasterEmail = await this.clientesMasterService.findByUserId(existingUserBaseByEmail.id);
        const hasSubscription = clientesMasterEmail.length > 0 
          ? await this.hasActiveSubscription(clientesMasterEmail[0].id)
          : false;
        
        if (hasSubscription) {
          throw new ConflictException('Já existe um usuário cadastrado com este e-mail e possui assinatura ativa');
        }
        
        return await this.handleExistingCustomerWithoutSubscription(
          existingUserBaseByEmail,
          createCustomerDto,
          telefoneNormalizado,
        );
      }
      
      if (existingUserBaseByPhone && !mesmoUsuario) {
        const clientesMasterPhone = await this.clientesMasterService.findByUserId(existingUserBaseByPhone.id);
        const hasSubscription = clientesMasterPhone.length > 0 
          ? await this.hasActiveSubscription(clientesMasterPhone[0].id)
          : false;
        
        if (hasSubscription) {
          throw new ConflictException('Já existe um usuário cadastrado com este telefone e possui assinatura ativa');
        }
        
        return await this.handleExistingCustomerWithoutSubscription(
          existingUserBaseByPhone,
          createCustomerDto,
          telefoneNormalizado,
        );
      }
      
      // 5. Se chegou aqui, não existe usuário com este email E telefone
      // Verificar se já existe ClienteMaster com este email (caso raro, mas possível)
      const existingClienteMaster = await this.clientesMasterService.findByEmail(createCustomerDto.email);
      
      let clienteMaster;
      let userBase;
      let pagarMeCustomerId: string;

      if (existingClienteMaster) {
        // ClienteMaster já existe (caso raro)
        clienteMaster = existingClienteMaster;
        userBase = await this.userBaseService.findById(existingClienteMaster.userId);
        
        if (!userBase) {
          throw new InternalServerErrorException('UserBase não encontrado para o ClienteMaster existente');
        }
        
        if (userBase.pagarMeCustomerId) {
          return {
            pagarMeCustomerId: userBase.pagarMeCustomerId,
            userId: userBase.id,
          };
        }
        newRelicLog('info', 'Criando customer no Pagar.me - Cliente existente', {
          email: createCustomerDto.email,
          userBaseId: userBase.id,
        });
        const customerRes = await this.pagarMeService.createCustomer(
          this.preparePagarMeCustomerData(
            createCustomerDto.name,
            createCustomerDto.email,
            createCustomerDto.cpf,
            createCustomerDto.phone,
            createCustomerDto.postalCode,
            createCustomerDto.address,
            createCustomerDto.addressNumber,
            createCustomerDto.complement,
            createCustomerDto.province,
            createCustomerDto.city,
            createCustomerDto.state,
            userBase.id,
            createCustomerDto.birthdate,
          ),
        );
        pagarMeCustomerId = customerRes.id;
        newRelicLog('info', 'Customer criado no Pagar.me com sucesso', {
          pagarMeCustomerId,
          userBaseId: userBase.id,
          email: createCustomerDto.email,
        });
        await this.userBaseService.update(userBase.id, { pagarMeCustomerId });
        return { pagarMeCustomerId, userId: userBase.id };
      } else {
        const hashedPassword = await bcrypt.hash(createCustomerDto.password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);

        newRelicLog('info', 'Criando customer no Pagar.me - Novo usuário', {
          email: createCustomerDto.email,
          name: createCustomerDto.name,
        });
        const customerRes = await this.pagarMeService.createCustomer(
          this.preparePagarMeCustomerData(
            createCustomerDto.name,
            createCustomerDto.email,
            createCustomerDto.cpf,
            createCustomerDto.phone,
            createCustomerDto.postalCode,
            createCustomerDto.address,
            createCustomerDto.addressNumber,
            createCustomerDto.complement,
            createCustomerDto.province,
            createCustomerDto.city,
            createCustomerDto.state,
            undefined,
            createCustomerDto.birthdate,
          ),
        );
        pagarMeCustomerId = customerRes.id;
        newRelicLog('info', 'Customer criado no Pagar.me com sucesso - Novo usuário', {
          pagarMeCustomerId,
          email: createCustomerDto.email,
        });

        userBase = await this.userBaseService.create({
          nome: createCustomerDto.name,
          email: createCustomerDto.email,
          password: hashedPassword,
          cpf: createCustomerDto.cpf,
          telefone: telefoneNormalizado,
          postalCode: createCustomerDto.postalCode,
          address: createCustomerDto.address,
          addressNumber: createCustomerDto.addressNumber,
          complement: createCustomerDto.complement,
          province: createCustomerDto.province,
          city: createCustomerDto.city,
          state: createCustomerDto.state,
          isVerified: false,
          verificationToken,
          tokenExpiresAt,
          pagarMeCustomerId,
        });
      }

      return { pagarMeCustomerId, userId: userBase.id };
    } catch (error: any) {
      if (error instanceof ConflictException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        newRelicLog('error', 'Erro ao criar customer - Validação falhou', {
          error: error.message,
          email: createCustomerDto.email,
        });
        throw error;
      }
      newRelicLog('error', 'Erro ao criar customer - Erro inesperado', {
        error: error.message,
        stack: error.stack,
        email: createCustomerDto.email,
      });
      throw new BadRequestException(
        `Erro ao criar customer: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Verifica se o cliente tem assinatura ativa ou pendente
   */
  private async hasActiveSubscription(clienteMasterId: string): Promise<boolean> {
    const assinatura = await this.assinaturaRepository.findOne({
      where: [
        { userId: clienteMasterId, status: 'ACTIVE' },
        { userId: clienteMasterId, status: 'PENDING' },
      ],
    });
    return !!assinatura;
  }

  /**
   * Prepara dados do customer para enviar ao Pagar.me.
   * Inclui phones (obrigatório para criar pedido no gateway).
   */
  private preparePagarMeCustomerData(
    name: string,
    email: string,
    cpf: string,
    phone: string,
    postalCode: string,
    address: string,
    addressNumber: string,
    complement?: string,
    province?: string,
    city?: string,
    state?: string,
    code?: string,
    birthdate?: string,
  ): PagarMeCreateCustomerDto {
    const doc = (cpf || '').replace(/\D/g, '');
    const dto: PagarMeCreateCustomerDto = {
      name,
      email,
      document: doc,
      document_type: doc.length <= 11 ? 'cpf' : 'cnpj',
      type: 'individual',
      address: {
        country: 'BR',
        state: state || '',
        city: city || '',
        zip_code: (postalCode || '').replace(/\D/g, ''),
        line_1: [address, addressNumber].filter(Boolean).join(', '),
        line_2: complement,
      },
    };
    if (birthdate) dto.birthdate = birthdate;
    if (code) dto.code = code;

    const phones = this.buildPagarMePhones(phone);
    if (phones) dto.phones = phones;

    return dto;
  }

  /**
   * Converte telefone (ex: 11999998888, (11) 99999-8888) para o formato Pagar.me.
   * Brasil: country_code 55, area_code 2 dígitos, number 8 ou 9 dígitos.
   */
  private buildPagarMePhones(phone: string | null | undefined): PagarMeCreateCustomerDto['phones'] | undefined {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length < 10) return undefined;
    const countryCode = '55';
    let areaCode: string;
    let number: string;
    if (digits.length === 11 && digits.startsWith('9')) {
      areaCode = digits.slice(0, 2);
      number = digits.slice(2);
    } else if (digits.length === 10) {
      areaCode = digits.slice(0, 2);
      number = digits.slice(2);
    } else if (digits.length === 11) {
      areaCode = digits.slice(0, 2);
      number = digits.slice(2);
    } else if (digits.length >= 12 && digits.startsWith('55')) {
      areaCode = digits.slice(2, 4);
      number = digits.slice(4);
    } else {
      areaCode = digits.slice(0, 2);
      number = digits.slice(2).slice(-8);
    }
    if (!areaCode || !number) return undefined;
    const mobile = { country_code: countryCode, area_code: areaCode, number: number.slice(-9) };
    return { mobile_phone: mobile };
  }

  /**
   * Monta o endereço de cobrança para o Pagar.me a partir da assinatura (ou UserBase se faltar).
   */
  /** Sempre retorna um objeto (vazio se não houver dados) para o order sempre enviar billing_address. */
  private async buildBillingAddressFromAssinatura(assinatura: Assinatura): Promise<PagarMeBillingAddress> {
    let line1 = [assinatura.address, assinatura.addressNumber].filter(Boolean).join(', ').trim();
    let city = assinatura.city || '';
    let state = assinatura.state || '';
    let zipCode = (assinatura.postalCode || '').replace(/\D/g, '');
    let line2 = assinatura.complement || undefined;

    if (!line1 && assinatura.userId) {
      const cm = await this.clientesMasterService.findById(assinatura.userId);
      if (cm?.userId) {
        const ub = await this.userBaseService.findById(cm.userId);
        if (ub) {
          line1 = [ub.address, ub.addressNumber].filter(Boolean).join(', ').trim();
          city = ub.city || city;
          state = ub.state || state;
          zipCode = zipCode || (ub.postalCode || '').replace(/\D/g, '');
          line2 = line2 || ub.complement || undefined;
        }
      }
    }

    return {
      country: 'BR',
      state: state || '',
      city: city || '',
      zip_code: zipCode || '',
      line_1: line1 || '',
      line_2: line2,
    };
  }

  /** Garante que o customer existe no Pagar.me (cria se não tiver) */
  private async ensurePagarMeCustomer(
    userBase: any,
    createCustomerDto: CreateCustomerDto,
  ): Promise<string> {
    if (userBase.pagarMeCustomerId) {
      return userBase.pagarMeCustomerId;
    }
    const customerRes = await this.pagarMeService.createCustomer(
      this.preparePagarMeCustomerData(
        createCustomerDto.name,
        createCustomerDto.email,
        createCustomerDto.cpf,
        createCustomerDto.phone,
        createCustomerDto.postalCode,
        createCustomerDto.address,
        createCustomerDto.addressNumber,
        createCustomerDto.complement,
        createCustomerDto.province,
        createCustomerDto.city,
        createCustomerDto.state,
        userBase.id,
        createCustomerDto.birthdate,
      ),
    );
    await this.userBaseService.update(userBase.id, { pagarMeCustomerId: customerRes.id });
    return customerRes.id;
  }

  private async updateExistingUserBase(
    userBase: any,
    createCustomerDto: CreateCustomerDto,
    telefoneNormalizado: string,
    pagarMeCustomerId: string,
  ): Promise<void> {
    const updateData: any = {
      nome: createCustomerDto.name,
      cpf: createCustomerDto.cpf,
      telefone: telefoneNormalizado,
      postalCode: createCustomerDto.postalCode,
      address: createCustomerDto.address,
      addressNumber: createCustomerDto.addressNumber,
      complement: createCustomerDto.complement,
      province: createCustomerDto.province,
      city: createCustomerDto.city,
      state: createCustomerDto.state,
      pagarMeCustomerId,
    };
    if (createCustomerDto.password) {
      updateData.password = await bcrypt.hash(createCustomerDto.password, 10);
    }
    await this.userBaseService.update(userBase.id, updateData);
  }

  private async handleExistingCustomerWithoutSubscription(
    userBase: any,
    createCustomerDto: CreateCustomerDto,
    telefoneNormalizado: string,
  ): Promise<{ pagarMeCustomerId: string; userId: string }> {
    const pagarMeCustomerId = await this.ensurePagarMeCustomer(userBase, createCustomerDto);
    await this.updateExistingUserBase(userBase, createCustomerDto, telefoneNormalizado, pagarMeCustomerId);
    return { pagarMeCustomerId, userId: userBase.id };
  }

  /**
   * Faz checkout completo: tokenização + pagamento + assinatura
   * Recebe apenas o userId e busca os dados do cliente no banco
   * 
   * IMPORTANTE: Este método reutiliza a lógica do método create(), mas com algumas diferenças:
   * - Busca os dados do cliente pelo userId
   * - Faz tokenização do cartão antes de chamar create()
   */
  async checkoutComplete(checkoutDto: CheckoutCompleteDto): Promise<any> {
    newRelicLog('info', 'Checkout iniciado', {
      userId: checkoutDto.userId,
      planoId: checkoutDto.planoId,
      billingType: checkoutDto.billingType,
      couponName: checkoutDto.couponName || null,
    });

    // 1. Buscar UserBase pelo userId
    const userBase = await this.userBaseService.findById(checkoutDto.userId);
    if (!userBase) {
      newRelicLog('error', 'Checkout falhou - UserBase não encontrado', { userId: checkoutDto.userId });
      throw new NotFoundException('Usuário não encontrado');
    }
    newRelicLog('info', 'UserBase encontrado', { userId: userBase.id, email: userBase.email });

    // 2. Buscar ClienteMaster associado ao UserBase (se existir)
    // IMPORTANTE: ClienteMaster só será criado DEPOIS do pagamento confirmado
    let clientesMaster = await this.clientesMasterService.findByUserId(userBase.id);
    let clienteMaster = clientesMaster && clientesMaster.length > 0 ? clientesMaster[0] : null;

    // 3. Se ClienteMaster existe, verificar se já tem assinatura ACTIVE
    if (clienteMaster) {
      const existingActiveSubscription = await this.assinaturaRepository.findOne({
        where: { 
          userId: clienteMaster.id, // Usar ClienteMaster.id, não UserBase.id
          status: 'ACTIVE',
        },
      });

      if (existingActiveSubscription) {
        throw new BadRequestException('Assinatura ativa. Fale com o Suporte.');
      }
    }

    // 4. Obter ou criar pagarMeCustomerId
    let pagarMeCustomerId: string;
    const PLANOS_TESTE = [
      '677c76e6-0ab0-4626-87bd-23f13ad2cd76',
      'ca772fbf-d9c7-4ef7-9f6c-84e535c393f0',
    ];
    const isPlanoTeste = PLANOS_TESTE.includes(checkoutDto.planoId);

    if (userBase.pagarMeCustomerId) {
      pagarMeCustomerId = userBase.pagarMeCustomerId;
    } else if (isPlanoTeste) {
      pagarMeCustomerId = `cus_fake_test_${userBase.id}`;
    } else {
      throw new BadRequestException(
        'Usuário não possui Id de pagamentos no gateway. Chame POST /assinaturas/customer antes.',
      );
    }

    // 5. Buscar plano e calcular valor
    const plano = await this.planosService.findById(checkoutDto.planoId);
    if (!plano) {
      newRelicLog('error', 'Checkout falhou - Plano não encontrado', { planoId: checkoutDto.planoId });
      throw new NotFoundException('Plano não encontrado');
    }
    newRelicLog('info', 'Plano encontrado', { planoId: plano.id, nome: plano.nome, valor: plano.valorPromocional || plano.valorOriginal });

    // Calcular valor do plano (prioriza valor promocional se existir)
    const valorBasePlano = plano.valorPromocional ?? plano.valorOriginal ?? null;
    if (!valorBasePlano || valorBasePlano === null || Number(valorBasePlano) <= 0) {
      throw new BadRequestException(
        `O plano "${plano.nome}" não possui valor configurado. Configure valorOriginal ou valorPromocional no plano antes de criar assinaturas.`,
      );
    }

    // Calcular valor final com desconto se cupom válido
    let valorFinal = Number(valorBasePlano);
    let coupon: Cupom | null = null;
    let couponId: string | null = null;
    
    if (checkoutDto.couponName) {
      coupon = await this.cuponsService.findByName(checkoutDto.couponName);
      if (coupon && coupon.active) {
        const desconto = (valorFinal * Number(coupon.discountValue)) / 100;
        valorFinal = valorFinal - desconto;
        if (valorFinal < 0) valorFinal = 0;
        couponId = coupon.id;
        newRelicLog('info', 'Cupom aplicado', {
          couponName: coupon.name,
          discountValue: coupon.discountValue,
          valorAntes: Number(valorBasePlano),
          valorDepois: valorFinal,
        });
      }
    }

    if (!valorFinal || valorFinal <= 0) {
      throw new BadRequestException(
        'O valor da assinatura deve ser maior que zero. Verifique o valor do plano.',
      );
    }

    // 6. Cartão: token e card_id (addCard no Pagar.me para planos reais)
    let creditCardToken: string | null = null;
    let creditCardNumber: string | null = null;
    let creditCardBrand: string | null = null;
    let cardId: string | null = null;

    if (checkoutDto.billingType === 'CREDIT_CARD') {
      if (!checkoutDto.creditCardToken) {
        throw new BadRequestException('Token do cartão de crédito é obrigatório. A tokenização deve ser feita no frontend.');
      }
      creditCardToken = checkoutDto.creditCardToken;
      creditCardNumber = checkoutDto.creditCardNumber || null;
      creditCardBrand = checkoutDto.creditCardBrand || null;

      // Vincular cartão ao cliente no Pagar.me para obter card_id (igual ao create)
      if (!isPlanoTeste) {
        try {
          const billingAddress: PagarMeBillingAddress = {
            country: 'BR',
            state: userBase.state || '',
            city: userBase.city || '',
            zip_code: (userBase.postalCode || '').replace(/\D/g, ''),
            line_1: [userBase.address, userBase.addressNumber].filter(Boolean).join(', '),
            line_2: userBase.complement || '',
          };

          const cardRes = await this.pagarMeService.addCard(
            pagarMeCustomerId,
            creditCardToken,
            billingAddress,
          );
          cardId = cardRes.id;
          if(!cardId) {
            throw new BadRequestException('Cartão nao encontrado');
          }
          newRelicLog('info', 'Cartão vinculado ao cliente', {
            customerId: pagarMeCustomerId,
            cardId: cardId,
            brand: creditCardBrand,
          });
        } catch (error: any) {
          newRelicLog('error', 'Erro ao vincular cartão no checkoutComplete', { error: error.message, customerId: pagarMeCustomerId });
          throw new BadRequestException(`Erro ao vincular cartão: ${error.message || 'Erro desconhecido'}`);
        }
      }
    }

    if (checkoutDto.billingType === 'CREDIT_CARD' && !isPlanoTeste && !cardId) {
      throw new BadRequestException('Não foi possível vincular o cartão ao cliente.');
    }

    // 7. Processar pagamento
    // Planos de teste: cobrança fake imediata
    // Plano Estudante: cobrança real imediata
    // Planos normais: sem cobrança no checkout; recorrência cobra em 5 dias
    const planosEstudanteIds = [
      '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7', // Plano Estudante
      '1503826a-ee30-4fa9-9955-c77d11fe44ed', // Plano Estudante PRO
    ];
    const isPlanoEstudante = planosEstudanteIds.includes(checkoutDto.planoId);
    let paymentResult: any = null;

    if (isPlanoEstudante && checkoutDto.billingType === 'CREDIT_CARD') {
      // Plano Estudante: processar cobrança REAL imediata
      console.log('🎓 Plano Estudante: Processando cobrança imediata');
      
      if (!cardId) {
        throw new BadRequestException('Cartão não foi vinculado corretamente para o Plano Estudante.');
      }
      
      try {
        const orderCode = `estudante_${Date.now()}`;
        
        // Construir billing address a partir do userBase
        const line1 = [userBase.address, userBase.addressNumber].filter(Boolean).join(', ').trim() || '';
        const billingAddress: PagarMeBillingAddress = {
          line_1: line1,
          zip_code: (userBase.postalCode || '').replace(/\D/g, '') || '',
          city: userBase.city || '',
          state: userBase.state || '',
          country: 'BR',
          line_2: userBase.complement || undefined,
        };
        
        // Converter valor de reais para centavos (inteiro)
        const valorFinalCentavos = Math.round(valorFinal * 100);
        
        const orderResult = await this.pagarMeService.createOrder({
          code: orderCode,
          customer_id: pagarMeCustomerId,
          items: [
            {
              amount: valorFinalCentavos,
              description: `Plano Estudante - ${plano.nome}`,
              quantity: 1,
              code: orderCode,
            },
          ],
          payments: [
            {
              payment_method: 'credit_card',
              credit_card: {
                card_id: cardId,
                installments: 1,
                operation_type: 'auth_and_capture',
                statement_descriptor: 'NODON',
                card: { billing_address: billingAddress },
              },
            },
          ],
        });

        paymentResult = {
          id: orderResult.id,
          status: orderResult.status,
          customer: pagarMeCustomerId,
          value: valorFinal,
          dueDate: this.getDataAtualBrasil(),
          paymentDate: orderResult.status === 'paid' ? this.getDataAtualBrasil() : null,
        };

        // Verificar se o pagamento foi aprovado
        if (orderResult.status !== 'paid') {
          console.error('❌ Pagamento do Plano Estudante não foi aprovado:', {
            orderId: orderResult.id,
            status: orderResult.status,
          });
          
          // Registrar cobrança com status de falha
          await this.registrarCobranca({
            userId: null,
            pagarMeOrderId: orderResult.id,
            pagarMeCustomerId: pagarMeCustomerId,
            value: valorFinal,
            billingType: 'CREDIT_CARD',
            status: 'failed',
            dueDate: new Date(),
            paymentDate: null,
            pagarMeResponse: JSON.stringify(orderResult),
            assinaturaId: null,
            planoId: checkoutDto.planoId,
            couponId: couponId || null,
            dadosAssinatura: JSON.stringify({
              name: userBase.nome,
              email: userBase.email,
              cpf: userBase.cpf || '',
              phone: userBase.telefone || '',
              billingType: checkoutDto.billingType,
              userBaseId: userBase.id,
            }),
          });
          
          newRelicLog('error', 'Plano Estudante - Pagamento recusado', {
            orderId: orderResult.id,
            status: orderResult.status,
            valor: valorFinal,
            customerId: pagarMeCustomerId,
          });
          throw new BadRequestException(
            `Pagamento não aprovado. Status: ${orderResult.status}. Verifique os dados do cartão e tente novamente.`
          );
        }

        await this.registrarCobranca({
          userId: null,
          pagarMeOrderId: orderResult.id,
          pagarMeCustomerId: pagarMeCustomerId,
          value: valorFinal,
          billingType: 'CREDIT_CARD',
          status: 'paid',
          dueDate: new Date(),
          paymentDate: new Date(),
          pagarMeResponse: JSON.stringify(orderResult),
          assinaturaId: null,
          planoId: checkoutDto.planoId,
          couponId: couponId || null,
          dadosAssinatura: JSON.stringify({
            name: userBase.nome,
            email: userBase.email,
            cpf: userBase.cpf || '',
            phone: userBase.telefone || '',
            billingType: checkoutDto.billingType,
            userBaseId: userBase.id,
          }),
        });

        console.log('✅ Pagamento aprovado e cobrança registrada para Plano Estudante:', orderResult.id);
        newRelicLog('info', 'Plano Estudante - Pagamento aprovado', {
          orderId: orderResult.id,
          status: orderResult.status,
          valor: valorFinal,
          customerId: pagarMeCustomerId,
        });
      } catch (error: any) {
        console.error('❌ Erro ao processar cobrança do Plano Estudante:', error.message);
        newRelicLog('error', 'Plano Estudante - Erro ao processar pagamento', {
          error: error.message,
          stack: error.stack,
          planoId: checkoutDto.planoId,
          userId: checkoutDto.userId,
        });
        throw new BadRequestException(`Erro ao processar pagamento: ${error.message}`);
      }
    } else if (isPlanoTeste && checkoutDto.billingType === 'CREDIT_CARD') {
      // Planos de teste: processar cobrança fake imediata (comportamento original)
      console.log('🧪 Modo TESTE: Criando pagamento e assinatura fake para plano de teste');
      const dueDateString = this.getDataAtualBrasil();
      const paymentDateString = this.getDataAtualBrasil();
      
      paymentResult = {
        id: `or_fake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customer: pagarMeCustomerId || 'cus_fake_test',
        value: valorFinal,
        netValue: valorFinal,
        originalValue: valorFinal,
        interestValue: 0,
        description: `Pagamento TESTE - ${plano.nome}`,
        billingType: 'CREDIT_CARD',
        status: 'paid',
        dueDate: dueDateString,
        paymentDate: paymentDateString,
        originalDueDate: dueDateString,
        invoiceUrl: null,
        invoiceNumber: null,
        externalReference: null,
        deleted: false,
        anticipated: false,
        anticipable: false,
        refunds: null,
        dateCreated: paymentDateString,
        clientPaymentDate: paymentDateString,
        installmentNumber: null,
        transactionReceiptUrl: null,
        nossoNumero: null,
        bankSlipUrl: null,
        lastInvoiceViewedDate: null,
        lastBankSlipViewedDate: null,
        discount: null,
        fine: null,
        interest: null,
        postalService: false,
        creditCard: {
          creditCardNumber: creditCardNumber || '****',
          creditCardBrand: creditCardBrand || 'VISA',
          creditCardToken: creditCardToken || 'fake_token',
        },
      };

      await this.registrarCobranca({
        userId: null,
        pagarMeOrderId: paymentResult.id,
        pagarMeCustomerId: pagarMeCustomerId,
        value: valorFinal,
        billingType: 'CREDIT_CARD',
        status: 'paid',
        dueDate: paymentResult.dueDate ? this.parseDataBrasil(paymentResult.dueDate) : null,
        paymentDate: paymentResult.paymentDate ? this.parseDataBrasil(paymentResult.paymentDate) : null,
        pagarMeResponse: JSON.stringify(paymentResult),
        assinaturaId: null,
        planoId: checkoutDto.planoId,
        couponId: couponId || null,
        dadosAssinatura: JSON.stringify({
          name: userBase.nome,
          email: userBase.email,
          cpf: userBase.cpf || '',
          phone: userBase.telefone || '',
          postalCode: userBase.postalCode || '',
          address: userBase.address || '',
          addressNumber: userBase.addressNumber || '',
          complement: userBase.complement || '',
          province: userBase.province || '',
          city: userBase.city || '',
          state: userBase.state || '',
          billingType: checkoutDto.billingType,
          creditCardToken: creditCardToken,
          creditCardNumber: creditCardNumber || '',
          creditCardBrand: creditCardBrand || '',
          userBaseId: userBase.id,
        }),
      });

      console.log('✅ Pagamento fake criado para plano de teste:', paymentResult.id);
    } else if (checkoutDto.billingType === 'CREDIT_CARD' && !isPlanoEstudante) {
      console.log('✅ Cartão vinculado (card_id). Primeira cobrança em 5 dias pela recorrência.');
    }

    // 8. Criar ClienteMaster
    if (!clienteMaster) {
      clienteMaster = await this.clientesMasterService.create({
        userId: userBase.id,
      });
      if (isPlanoTeste) {
        console.log('✅ ClienteMaster criado para plano de teste:', clienteMaster.id);
      } else if (isPlanoEstudante) {
        console.log('✅ ClienteMaster criado para Plano Estudante (cobrança imediata):', clienteMaster.id);
      } else {
        console.log('✅ ClienteMaster criado. Período grátis de 5 dias ativado:', clienteMaster.id);
      }
    }

    // 9. Criar assinatura no banco de dados
    // Planos de teste (PLANOS_TESTE): próximo mês (comportamento original)
    // Plano Estudante: próximo mês (já cobrado imediatamente)
    // Demais planos: 5 dias grátis
    let nextDueDateString: string;
    if (isPlanoEstudante || isPlanoTeste) {
      nextDueDateString = this.calcularProximoMes();
    } else {
      nextDueDateString = this.calcularProximos7Dias();
    }
    const nextDueDate = this.parseDataBrasil(nextDueDateString);

    const assinaturaData: Partial<Assinatura> = {
      userId: clienteMaster.id,
      pagarMeCustomerId: pagarMeCustomerId,
      planoId: checkoutDto.planoId,
      couponId: couponId || undefined,
      name: userBase.nome,
      email: userBase.email,
      cpf: userBase.cpf || '',
      phone: userBase.telefone || '',
      postalCode: userBase.postalCode || '',
      address: userBase.address || '',
      addressNumber: userBase.addressNumber || '',
      complement: userBase.complement || '',
      province: userBase.province || '',
      city: userBase.city || '',
      state: userBase.state || '',
      value: valorFinal,
      billingType: checkoutDto.billingType,
      creditCardToken: creditCardToken || '',
      creditCardNumber: creditCardNumber || '',
      creditCardBrand: creditCardBrand || '',
      status: 'ACTIVE',
      nextDueDate: nextDueDate,
      pagarMeCardId: cardId || null,
    };
    const assinatura = this.assinaturaRepository.create(assinaturaData);

    try {
      const savedSubscription = await this.assinaturaRepository.save(assinatura);
      newRelicLog('info', 'Assinatura criada no banco', {
        assinaturaId: savedSubscription.id,
        userId: savedSubscription.userId,
        planoId: savedSubscription.planoId,
        status: savedSubscription.status,
        valor: savedSubscription.value,
        nextDueDate: savedSubscription.nextDueDate,
      });
      await this.gerenciarRecorrencia(savedSubscription);

      if (isPlanoTeste && paymentResult && paymentResult.status === 'paid') {
        const cobranca = await this.cobrancaRepository.findOne({
          where: { pagarMeOrderId: paymentResult.id },
        });
        if (cobranca) {
          cobranca.userId = clienteMaster.id;
          cobranca.assinaturaId = savedSubscription.id;
          await this.cobrancaRepository.save(cobranca);
          console.log(`✅ Cobrança ${cobranca.id} atualizada com userId e assinaturaId para plano de teste`);
        }
      }

      if (isPlanoTeste) {
        console.log('✅ Assinatura de teste criada com sucesso:', savedSubscription.id);
        newRelicLog('info', 'Checkout concluído com sucesso - Plano Teste', {
          assinaturaId: savedSubscription.id,
          userId: savedSubscription.userId,
          planoId: savedSubscription.planoId,
        });
        return {
          statusCode: 200,
          message: 'Pagamento aprovado e assinatura criada com sucesso (plano de teste)',
          data: {
            pagamento: paymentResult ? {
              id: paymentResult.id,
              status: paymentResult.status,
              value: paymentResult.value,
              dueDate: paymentResult.dueDate,
              paymentDate: paymentResult.paymentDate,
              customer: paymentResult.customer,
            } : null,
            assinatura: this.toResponseDto(savedSubscription),
          },
          pagarMeCustomerId: pagarMeCustomerId,
        };
      } else {
        newRelicLog('info', 'Checkout concluído com sucesso', {
          assinaturaId: savedSubscription.id,
          userId: savedSubscription.userId,
          planoId: savedSubscription.planoId,
          isPlanoEstudante,
        });
        return {
          statusCode: 200,
          message: 'Assinatura criada com sucesso! Período grátis de 5 dias ativado.',
          data: {
            assinatura: this.toResponseDto(savedSubscription),
            periodoGratis: {
              ativo: true,
              diasRestantes: 5,
              primeiraCobranca: nextDueDateString,
              mensagem: 'A primeira cobrança será processada automaticamente após 5 dias.',
            },
          },
          pagarMeCustomerId: pagarMeCustomerId,
        };
      }
    } catch (error: any) {
      newRelicLog('error', 'Checkout falhou - Erro ao salvar assinatura', {
        error: error.message,
        stack: error.stack,
        userId: checkoutDto.userId,
        planoId: checkoutDto.planoId,
      });
      throw new InternalServerErrorException(
        `Erro ao salvar assinatura no banco de dados: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  private toResponseDto(subscription: Assinatura): SubscriptionResponseDto {
    return {
      id: subscription.id,
      userId: subscription.userId,
      pagarMeCustomerId: subscription.pagarMeCustomerId,
      pagarMeCardId: subscription.pagarMeCardId,
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
      nextDueDate: subscription.nextDueDate,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
