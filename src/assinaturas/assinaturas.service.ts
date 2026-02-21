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
import { ChatService } from '../chat/chat.service';

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
    private readonly asaasService: AsaasService,
    private readonly planosService: PlanosService,
    private readonly cuponsService: CuponsService,
    @Inject(forwardRef(() => ClientesMasterService))
    private readonly clientesMasterService: ClientesMasterService,
    private readonly usersService: UsersService,
    private readonly userBaseService: UserBaseService,
    private readonly userComumService: UserComumService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
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

        // Criar ClienteMaster vinculado ao UserBase
        clienteMaster = await this.clientesMasterService.create({
          userId: userBase.id,
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

    // 4. Criar cliente na ASAAS
    let asaasCustomerId: string;
    try {
      asaasCustomerId = await this.asaasService.createCustomer({
        name: createSubscriptionDto.name,
        email: createSubscriptionDto.email,
        cpfCnpj: createSubscriptionDto.cpf.replace(/\D/g, ''),
        phone: createSubscriptionDto.phone.replace(/\D/g, ''),
        postalCode: createSubscriptionDto.postalCode.replace(/\D/g, ''),
        address: createSubscriptionDto.address,
        addressNumber: createSubscriptionDto.addressNumber,
        complement: createSubscriptionDto.complement,
        province: createSubscriptionDto.province,
        city: createSubscriptionDto.city,
        state: createSubscriptionDto.state,
      });
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao criar cliente na ASAAS: ${error.message || 'Erro desconhecido'}`,
      );
    }

    // 5. Validar token do cartão já tokenizado no frontend (se necessário)
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

    // 6. Fazer cobrança avulsa na ASAAS
    let paymentResult: any = null;
    if (createSubscriptionDto.billingType === 'CREDIT_CARD') {
      if (!creditCardToken) {
        throw new BadRequestException('Token do cartão não foi gerado');
      }

      try {
        // Calcula a data de vencimento para hoje (data atual)
        const dueDateString = this.getDataAtualBrasil();

        // Criar pagamento avulso usando o token do cartão
        paymentResult = await this.asaasService.createPayment({
          billingType: 'CREDIT_CARD',
          customer: asaasCustomerId,
          value: valorFinal,
          dueDate: dueDateString,
          creditCardToken: creditCardToken,
        });

        // Registrar cobrança na tabela (SEMPRE registra, mesmo se não estiver aprovada)
        // Se status não for CONFIRMED, registra com userId e assinaturaId = null
        // Guarda dados necessários para criar assinatura depois se pagamento for confirmado
        const statusConfirmado = paymentResult.status === 'CONFIRMED' || paymentResult.status === 'RECEIVED';
        
        await this.registrarCobranca({
          userId: statusConfirmado ? clienteMaster.id : null, // null se não confirmado
          asaasPaymentId: paymentResult.id,
          asaasCustomerId: asaasCustomerId,
          value: valorFinal,
          billingType: 'CREDIT_CARD',
          status: paymentResult.status,
          dueDate: paymentResult.dueDate ? this.parseDataBrasil(paymentResult.dueDate) : null,
          paymentDate: paymentResult.paymentDate ? this.parseDataBrasil(paymentResult.paymentDate) : null,
          asaasResponse: JSON.stringify(paymentResult),
          assinaturaId: null, // Sempre null inicialmente, será vinculada depois se confirmado
          planoId: createSubscriptionDto.planoId,
          couponId: couponId || null,
          dadosAssinatura: JSON.stringify({
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
            billingType: createSubscriptionDto.billingType,
            creditCardToken: creditCardToken,
            creditCardNumber: creditCardNumber,
            creditCardBrand: creditCardBrand,
            userId: clienteMaster.id, // Guarda userId nos dados para usar depois
          }),
        });

        // Se pagamento não foi aprovado, não lança erro - apenas registra
        // A assinatura será criada depois quando o pagamento for confirmado
        if (!statusConfirmado) {
          console.log('⚠️ Pagamento criado mas não aprovado ainda. Status:', paymentResult.status);
          console.log('📝 Cobrança registrada com userId=null. Será atualizada quando status mudar para CONFIRMED.');
          // Retorna o paymentResult para o frontend poder verificar depois
          return {
            statusCode: 202,
            message: 'Pagamento criado. Aguardando confirmação.',
            data: {
              pagamento: {
                id: paymentResult.id,
                status: paymentResult.status,
                value: paymentResult.value,
                dueDate: paymentResult.dueDate,
                customer: paymentResult.customer,
              },
              assinatura: null,
            },
          };
        }

        console.log('✅ Pagamento aprovado:', paymentResult);
      } catch (error: any) {
        console.error('❌ Erro ao processar pagamento:', error);
        throw new BadRequestException(
          `Erro ao processar pagamento: ${error.message || 'Erro desconhecido'}`,
        );
      }
    }

    // 7. Calcula a data de vencimento da assinatura (7 dias grátis na primeira vez) - usando fuso horário do Brasil
    const nextDueDateString = this.calcularProximos7Dias();
    const nextDueDate = this.parseDataBrasil(nextDueDateString);

    // 8. Criar assinatura no banco de dados
    const assinaturaData: Partial<Assinatura> = {
      userId: clienteMaster.id,
      asaasCustomerId: asaasCustomerId, // ID do cliente criado na ASAAS
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
      
      // 9. Adiciona na tabela de recorrência (status sempre é ACTIVE ao criar)
      await this.gerenciarRecorrencia(savedSubscription);
      
      // 10. Se pagamento foi aprovado, vincular assinatura à cobrança
      // Não precisa atualizar status aqui porque acabamos de criar o pagamento e já temos o status atual
      if (paymentResult && (paymentResult.status === 'CONFIRMED' || paymentResult.status === 'RECEIVED')) {
        const cobranca = await this.cobrancaRepository.findOne({
          where: { asaasPaymentId: paymentResult.id },
        });
        if (cobranca) {
          cobranca.assinaturaId = savedSubscription.id;
          // Atualiza userId se ainda não tiver
          if (!cobranca.userId) {
            cobranca.userId = savedSubscription.userId;
          }
          await this.cobrancaRepository.save(cobranca);
          console.log(`✅ Assinatura ${savedSubscription.id} vinculada à cobrança ${cobranca.id} no checkout`);
        }
      }
      
      console.log('✅ Assinatura criada com sucesso:', savedSubscription.id);
      
      // Retornar pagamento aprovado e assinatura criada
      return {
        statusCode: 200,
        message: 'Pagamento aprovado e assinatura criada com sucesso',
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
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Erro ao salvar assinatura no banco de dados: ${error.message || 'Erro desconhecido'}`,
      );
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

    // 4. Validar token do cartão já tokenizado no frontend (se necessário)
    let creditCardToken: string | null = null;
    let creditCardNumber: string | null = null;
    let creditCardBrand: string | null = null;

    if (createSimpleSubscriptionDto.billingType === 'CREDIT_CARD') {
      if (!createSimpleSubscriptionDto.creditCardToken) {
        throw new BadRequestException('Token do cartão de crédito é obrigatório. A tokenização deve ser feita no frontend.');
      }

      creditCardToken = createSimpleSubscriptionDto.creditCardToken;
      creditCardNumber = createSimpleSubscriptionDto.creditCardNumber || null;
      creditCardBrand = createSimpleSubscriptionDto.creditCardBrand || null;
    }

    // 5. Calcula a data de vencimento (7 dias grátis na primeira vez) - usando fuso horário do Brasil
    const nextDueDateString = this.calcularProximos7Dias();
    const nextDueDate = this.parseDataBrasil(nextDueDateString);

    // 6. Salva assinatura no banco de dados (sem criar assinatura na ASAAS)
    const assinaturaData: Partial<Assinatura> = {
      userId: clienteMaster.id,
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
        // Atualiza nextDueDate para 1 mês à frente se não estiver definido
        if (!subscription.nextDueDate) {
          subscription.nextDueDate = this.parseDataBrasil(this.calcularProximoMes());
        }
        await this.assinaturaRepository.save(subscription);
        // Gerencia a tabela de recorrência
        await this.gerenciarRecorrencia(subscription);
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

  /**
   * Atualiza a cobrança com os dados mais recentes da ASAAS
   * Sempre busca status e dados completos do pagamento e atualiza se houver diferença
   */
  private async atualizarCobrancaComStatusAsaas(paymentId: string): Promise<Cobranca> {
    // 1. Buscar status do pagamento na ASAAS
    const paymentStatusResponse = await this.asaasService.getPaymentStatus(paymentId);
    const novoStatus = paymentStatusResponse.status;

    // 2. Buscar cobrança no banco de dados
    const cobranca = await this.cobrancaRepository.findOne({
      where: { asaasPaymentId: paymentId },
    });

    if (!cobranca) {
      throw new NotFoundException('Cobrança não encontrada para este pagamento');
    }

    // 3. Buscar dados completos do pagamento na ASAAS
    let paymentData: any = null;
    try {
      paymentData = await this.asaasService.getPayment(paymentId);
    } catch (error) {
      console.error('Erro ao buscar dados completos do pagamento:', error);
      // Continua mesmo se não conseguir buscar dados completos
    }

    // 4. Verificar se o status mudou ou se precisa atualizar outros campos
    const statusMudou = cobranca.status !== novoStatus;
    let precisaAtualizar = statusMudou;

    if (paymentData) {
      // Atualizar paymentDate se disponível e diferente
      if (paymentData.paymentDate) {
        const novoPaymentDate = this.parseDataBrasil(paymentData.paymentDate);
        if (!cobranca.paymentDate || cobranca.paymentDate.getTime() !== novoPaymentDate?.getTime()) {
          cobranca.paymentDate = novoPaymentDate;
          precisaAtualizar = true;
        }
      }

      // Atualizar dueDate se disponível e diferente
      if (paymentData.dueDate) {
        const novoDueDate = this.parseDataBrasil(paymentData.dueDate);
        if (!cobranca.dueDate || cobranca.dueDate.getTime() !== novoDueDate?.getTime()) {
          cobranca.dueDate = novoDueDate;
          precisaAtualizar = true;
        }
      }

      // Sempre atualizar resposta completa da ASAAS para manter histórico
      const novaResposta = JSON.stringify(paymentData);
      if (cobranca.asaasResponse !== novaResposta) {
        cobranca.asaasResponse = novaResposta;
        precisaAtualizar = true;
      }
    }

    // 5. Atualizar status se mudou
    if (statusMudou) {
      console.log(`🔄 Status da cobrança ${paymentId} mudou: ${cobranca.status} → ${novoStatus}`);
      cobranca.status = novoStatus;
    }

    // 6. Salvar apenas se houver mudanças
    if (precisaAtualizar) {
      await this.cobrancaRepository.save(cobranca);
      console.log(`✅ Cobrança ${paymentId} atualizada com sucesso`);
    }

    return cobranca;
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    try {
      // 1. Atualizar cobrança com status mais recente da ASAAS
      const cobranca = await this.atualizarCobrancaComStatusAsaas(paymentId);
      const status = cobranca.status;

      // 2. Se pagamento foi confirmado e ainda não tem assinatura vinculada
      if ((status === 'CONFIRMED' || status === 'RECEIVED') && !cobranca.assinaturaId) {
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

    // Calcula a data de vencimento da assinatura (7 dias grátis na primeira vez)
    const nextDueDateString = this.calcularProximos7Dias();
    const nextDueDate = this.parseDataBrasil(nextDueDateString);

    // Criar assinatura
    const assinaturaData: Partial<Assinatura> = {
      userId: cobranca.userId,
      asaasCustomerId: cobranca.asaasCustomerId, // ID do cliente na ASAAS da cobrança
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

    // Busca tokens do chat da tabela chat_conversations
    const tokensChatUsados = await this.chatService.getTotalTokensByClienteMaster(clienteMaster.id);
    
    // Calcula tokens e análises do período da assinatura (desde criação até próxima renovação)
    let tokensChatUsadosPeriodo = 0;
    let analisesFeitasPeriodo = 0;
    
    if (dataInicioAssinatura) {
      // Busca tokens do chat no período completo da assinatura (desde criação até próxima renovação)
      tokensChatUsadosPeriodo = await this.chatService.getTotalTokensByClienteMasterInPeriod(
        clienteMaster.id, 
        dataInicioAssinatura,
        dataFimAssinatura || agora // Se não tem data fim, usa data atual
      );
      
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

    // Se não for master, retorna apenas tokens e análises
    if (userTipo !== 'master') {
      return {
        clienteMasterId: clienteMaster.id,
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
   * Calcula a data de 7 dias à frente (período de teste grátis)
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
    
    // Adiciona 7 dias
    const proximos7Dias = new Date(agora);
    proximos7Dias.setDate(proximos7Dias.getDate() + 7);
    
    const partes = formatter.formatToParts(proximos7Dias);
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
    asaasPaymentId: string;
    asaasCustomerId: string;
    value: number;
    billingType: string;
    status: string;
    dueDate: Date | null;
    paymentDate: Date | null;
    asaasResponse: string;
    assinaturaId?: string | null;
    planoId?: string | null;
    couponId?: string | null;
    dadosAssinatura?: string | null;
  }): Promise<Cobranca> {
    try {
      // Verifica se já existe cobrança com este paymentId
      const cobrancaExistente = await this.cobrancaRepository.findOne({
        where: { asaasPaymentId: data.asaasPaymentId },
      });

      if (cobrancaExistente) {
        // Atualiza a cobrança existente
        // Sempre atualiza status (importante para mudança PENDING → CONFIRMED)
        cobrancaExistente.status = data.status;
        
        // Atualiza paymentDate se fornecido
        if (data.paymentDate) {
          cobrancaExistente.paymentDate = data.paymentDate;
        }
        
        // Atualiza userId se fornecido e ainda não tiver (permite vincular depois)
        if (data.userId && !cobrancaExistente.userId) {
          cobrancaExistente.userId = data.userId;
        }
        
        // Atualiza assinaturaId se fornecido
        if (data.assinaturaId) {
          cobrancaExistente.assinaturaId = data.assinaturaId;
        }
        
        // Sempre atualiza resposta da ASAAS para manter histórico atualizado
        cobrancaExistente.asaasResponse = data.asaasResponse;
        
        // Atualiza outros campos se fornecidos
        if (data.dueDate !== undefined) {
          cobrancaExistente.dueDate = data.dueDate;
        }
        if (data.planoId !== undefined) {
          cobrancaExistente.planoId = data.planoId;
        }
        if (data.couponId !== undefined) {
          cobrancaExistente.couponId = data.couponId;
        }
        if (data.dadosAssinatura !== undefined) {
          cobrancaExistente.dadosAssinatura = data.dadosAssinatura;
        }
        
        return await this.cobrancaRepository.save(cobrancaExistente);
      } else {
        // Cria nova cobrança
        const cobranca = this.cobrancaRepository.create({
          userId: data.userId || null,
          asaasPaymentId: data.asaasPaymentId,
          asaasCustomerId: data.asaasCustomerId,
          value: data.value,
          billingType: data.billingType,
          status: data.status,
          dueDate: data.dueDate,
          paymentDate: data.paymentDate,
          asaasResponse: data.asaasResponse,
          assinaturaId: data.assinaturaId || null,
          planoId: data.planoId || null,
          couponId: data.couponId || null,
          dadosAssinatura: data.dadosAssinatura || null,
        });
        return await this.cobrancaRepository.save(cobranca);
      }
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
    // Validação: deve ter creditCard OU creditCardToken, mas não ambos
    if (createPaymentDto.creditCard && createPaymentDto.creditCardToken) {
      throw new BadRequestException('Não é possível enviar creditCard e creditCardToken ao mesmo tempo. Use apenas um deles.');
    }

    if (!createPaymentDto.creditCard && !createPaymentDto.creditCardToken) {
      throw new BadRequestException('É necessário enviar creditCard ou creditCardToken.');
    }

    // Se usar creditCard, validar campos obrigatórios
    if (createPaymentDto.creditCard) {
      if (
        !createPaymentDto.creditCard.holderName ||
        !createPaymentDto.creditCard.number ||
        !createPaymentDto.creditCard.expiryMonth ||
        !createPaymentDto.creditCard.expiryYear ||
        !createPaymentDto.creditCard.ccv
      ) {
        throw new BadRequestException('Todos os campos do cartão são obrigatórios quando usar creditCard.');
      }

      // Se usar creditCard, creditCardHolderInfo é obrigatório
      const holderInfo = createPaymentDto.creditCardHolderInfo;
      if (!holderInfo) {
        throw new BadRequestException('creditCardHolderInfo é obrigatório quando usar creditCard.');
      }

      if (
        !holderInfo.name ||
        !holderInfo.email ||
        !holderInfo.postalCode ||
        !holderInfo.addressNumber ||
        !holderInfo.cpfCnpj ||
        !holderInfo.phone
      ) {
        throw new BadRequestException('Todos os campos de creditCardHolderInfo são obrigatórios.');
      }
    }

    // Montar payload para ASAAS
    const paymentData: any = {
      billingType: createPaymentDto.billingType,
      customer: createPaymentDto.customer,
      value: createPaymentDto.value,
      dueDate: createPaymentDto.dueDate,
    };

    if (createPaymentDto.creditCard) {
      paymentData.creditCard = {
        holderName: createPaymentDto.creditCard.holderName,
        number: createPaymentDto.creditCard.number,
        expiryMonth: createPaymentDto.creditCard.expiryMonth,
        expiryYear: createPaymentDto.creditCard.expiryYear,
        ccv: createPaymentDto.creditCard.ccv,
      };

      // creditCardHolderInfo já foi validado acima
      const holderInfo = createPaymentDto.creditCardHolderInfo!;
      paymentData.creditCardHolderInfo = {
        name: holderInfo.name,
        email: holderInfo.email,
        postalCode: holderInfo.postalCode,
        addressNumber: holderInfo.addressNumber,
        cpfCnpj: holderInfo.cpfCnpj,
        phone: holderInfo.phone,
      };
    } else if (createPaymentDto.creditCardToken) {
      paymentData.creditCardToken = createPaymentDto.creditCardToken;
    }

    if (createPaymentDto.remoteIp) {
      paymentData.remoteIp = createPaymentDto.remoteIp;
    }

    // Chamar serviço ASAAS
    return await this.asaasService.createPayment(paymentData);
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
    
    try {
      await this.processarRecorrencias();
    } catch (error: any) {
      console.error(`❌ Erro no CRON automático:`, error.message);
      console.error(`   Stack:`, error.stack);
    }
  }

  /**
   * Processa recorrências que vencem hoje
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
    }

    const resultado = {
      processadas: recorrencias.length,
      sucesso: 0,
      falhas: 0,
      detalhes: [] as Array<{
        assinaturaId: string;
        status: string;
        mensagem: string;
      }>,
    };

    for (let i = 0; i < recorrencias.length; i++) {
      const recorrencia = recorrencias[i];
      const assinatura = recorrencia.assinatura;

      console.log(`\n${'-'.repeat(80)}`);
      console.log(`🔄 [${i + 1}/${recorrencias.length}] Processando recorrência ID: ${recorrencia.id}`);
      console.log(`   Assinatura ID: ${recorrencia.assinaturaId}`);
      console.log(`   Valor: R$ ${recorrencia.valor}`);
      console.log(`   Next Due Date: ${recorrencia.nextDueDate}`);

      if (!assinatura) {
        console.error(`❌ [${i + 1}/${recorrencias.length}] Assinatura não encontrada para recorrência ${recorrencia.id}`);
        resultado.falhas++;
        resultado.detalhes.push({
          assinaturaId: recorrencia.assinaturaId,
          status: 'ERRO',
          mensagem: 'Assinatura não encontrada',
        });
        continue;
      }

      console.log(`   Assinatura encontrada: ${assinatura.id}`);
      console.log(`   Status da assinatura: ${assinatura.status}`);
      console.log(`   Customer ID (ASAAS): ${assinatura.asaasCustomerId || 'NÃO ENCONTRADO'}`);
      console.log(`   Token do cartão: ${assinatura.creditCardToken ? 'PRESENTE' : 'NÃO ENCONTRADO'}`);

      // Verificar se assinatura está ativa
      if (assinatura.status !== 'ACTIVE') {
        console.log(`⚠️ [${i + 1}/${recorrencias.length}] Assinatura ${assinatura.id} não está ativa (status: ${assinatura.status}). Removendo da recorrência.`);
        await this.removerRecorrencia(assinatura.id);
        resultado.falhas++;
        resultado.detalhes.push({
          assinaturaId: assinatura.id,
          status: 'PULADO',
          mensagem: `Assinatura não está ativa (status: ${assinatura.status})`,
        });
        continue;
      }

      // Verificar se tem token do cartão
      if (!assinatura.creditCardToken || !assinatura.asaasCustomerId) {
        console.error(`❌ [${i + 1}/${recorrencias.length}] Assinatura ${assinatura.id} não tem token do cartão ou customer ID`);
        console.error(`   creditCardToken: ${assinatura.creditCardToken ? 'OK' : 'FALTANDO'}`);
        console.error(`   asaasCustomerId: ${assinatura.asaasCustomerId ? 'OK' : 'FALTANDO'}`);
        resultado.falhas++;
        resultado.detalhes.push({
          assinaturaId: assinatura.id,
          status: 'ERRO',
          mensagem: 'Dados insuficientes para cobrança (falta token ou customer ID)',
        });
        continue;
      }

      try {
        console.log(`💳 [${i + 1}/${recorrencias.length}] Criando cobrança na ASAAS...`);
        console.log(`   Valor: R$ ${Number(recorrencia.valor)}`);
        console.log(`   Due Date: ${hoje}`);
        console.log(`   Customer: ${assinatura.asaasCustomerId}`);
        console.log(`   Billing Type: ${assinatura.billingType || 'CREDIT_CARD'}`);

        // Criar cobrança na ASAAS
        const paymentResult = await this.asaasService.createPayment({
          billingType: assinatura.billingType || 'CREDIT_CARD',
          customer: assinatura.asaasCustomerId,
          value: Number(recorrencia.valor),
          dueDate: hoje,
          creditCardToken: assinatura.creditCardToken,
        });

        console.log(`✅ [${i + 1}/${recorrencias.length}] Cobrança criada na ASAAS`);
        console.log(`   Payment ID: ${paymentResult.id}`);
        console.log(`   Status: ${paymentResult.status}`);

        console.log(`💾 [${i + 1}/${recorrencias.length}] Registrando cobrança na tabela...`);
        
        // Registrar cobrança na tabela
        await this.registrarCobranca({
          userId: assinatura.userId,
          asaasPaymentId: paymentResult.id,
          asaasCustomerId: assinatura.asaasCustomerId,
          value: Number(recorrencia.valor),
          billingType: assinatura.billingType || 'CREDIT_CARD',
          status: paymentResult.status,
          dueDate: hojeDate,
          paymentDate: paymentResult.paymentDate ? this.parseDataBrasil(paymentResult.paymentDate) : null,
          asaasResponse: JSON.stringify(paymentResult),
          assinaturaId: null, // Será vinculada depois se confirmado
          planoId: assinatura.planoId || null,
          couponId: assinatura.couponId || null,
        });

        console.log(`✅ [${i + 1}/${recorrencias.length}] Cobrança registrada na tabela`);

        // Verificar status do pagamento
        if (paymentResult.status === 'CONFIRMED' || paymentResult.status === 'RECEIVED') {
          console.log(`✅ [${i + 1}/${recorrencias.length}] Pagamento CONFIRMED! Atualizando assinatura e recorrência...`);
          
          // ✅ Pagamento confirmado - atualizar assinatura e recorrência
          const proximoMes = this.calcularProximoMes();
          const proximoMesDate = this.parseDataBrasil(proximoMes);

          console.log(`   Próxima data de cobrança: ${proximoMes}`);

          // Atualizar assinatura
          console.log(`   Atualizando assinatura ${assinatura.id}...`);
          assinatura.nextDueDate = proximoMesDate;
          await this.assinaturaRepository.save(assinatura);
          console.log(`   ✅ Assinatura atualizada`);

          // Atualizar recorrência
          console.log(`   Atualizando recorrência ${recorrencia.id}...`);
          recorrencia.nextDueDate = proximoMesDate;
          recorrencia.valor = assinatura.value;
          await this.recorrenciaRepository.save(recorrencia);
          console.log(`   ✅ Recorrência atualizada`);

          // Vincular cobrança à assinatura
          console.log(`   Vinculando cobrança à assinatura...`);
          const cobranca = await this.cobrancaRepository.findOne({
            where: { asaasPaymentId: paymentResult.id },
          });
          if (cobranca) {
            cobranca.assinaturaId = assinatura.id;
            await this.cobrancaRepository.save(cobranca);
            console.log(`   ✅ Cobrança vinculada`);
          } else {
            console.log(`   ⚠️ Cobrança não encontrada para vincular`);
          }

          console.log(`✅ [${i + 1}/${recorrencias.length}] SUCESSO: Cobrança confirmada para assinatura ${assinatura.id}. Próxima cobrança: ${proximoMes}`);
          resultado.sucesso++;
          resultado.detalhes.push({
            assinaturaId: assinatura.id,
            status: 'SUCESSO',
            mensagem: `Pagamento confirmado. Próxima cobrança: ${proximoMes}`,
          });
        } else {
          console.log(`❌ [${i + 1}/${recorrencias.length}] Pagamento NÃO confirmado. Status: ${paymentResult.status}`);
          console.log(`   Colocando assinatura como PENDING e removendo da recorrência...`);
          
          // ❌ Pagamento falhou - colocar assinatura como PENDING e remover da recorrência
          assinatura.status = 'PENDING';
          await this.assinaturaRepository.save(assinatura);
          console.log(`   ✅ Assinatura marcada como PENDING`);

          // Remover da recorrência
          await this.removerRecorrencia(assinatura.id);
          console.log(`   ✅ Assinatura removida da recorrência`);

          // Atualizar status da cobrança para FAILED
          const cobranca = await this.cobrancaRepository.findOne({
            where: { asaasPaymentId: paymentResult.id },
          });
          if (cobranca) {
            cobranca.status = 'FAILED';
            await this.cobrancaRepository.save(cobranca);
            console.log(`   ✅ Cobrança marcada como FAILED`);
          }

          console.error(`❌ [${i + 1}/${recorrencias.length}] FALHA: Cobrança falhou para assinatura ${assinatura.id}. Status: ${paymentResult.status}`);
          resultado.falhas++;
          resultado.detalhes.push({
            assinaturaId: assinatura.id,
            status: 'FALHA',
            mensagem: `Pagamento não confirmado. Status: ${paymentResult.status}`,
          });
        }
      } catch (error: any) {
        // ❌ Erro ao processar cobrança
        console.error(`\n❌ [${i + 1}/${recorrencias.length}] ERRO ao processar cobrança para assinatura ${assinatura.id}:`);
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

        resultado.falhas++;
        resultado.detalhes.push({
          assinaturaId: assinatura.id,
          status: 'ERRO',
          mensagem: `Erro ao processar: ${error.message}`,
        });
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESUMO DO PROCESSAMENTO:`);
    console.log(`   Total processadas: ${resultado.processadas}`);
    console.log(`   ✅ Sucessos: ${resultado.sucesso}`);
    console.log(`   ❌ Falhas: ${resultado.falhas}`);
    console.log(`${'='.repeat(80)}\n`);
    
    return resultado;
  }

  /**
   * Cria um customer na Asaas e também grava no banco local (UserBase e ClienteMaster)
   * 
   * Validações:
   * - Se email E telefone já existem E tem assinatura ACTIVE ou PENDING → erro
   * - Se email E telefone já existem MAS não tem assinatura → erro (não pode cadastrar)
   * - Se cliente já existe mas não tem assinatura → retorna asaasCustomerId da base
   */
  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<{ 
    asaasCustomerId: string;
    userId: string;
  }> {
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
      let asaasCustomerId: string;
      
      if (existingClienteMaster) {
        // ClienteMaster já existe (caso raro)
        clienteMaster = existingClienteMaster;
        userBase = await this.userBaseService.findById(existingClienteMaster.userId);
        
        if (!userBase) {
          throw new InternalServerErrorException('UserBase não encontrado para o ClienteMaster existente');
        }
        
        // Verificar se já tem asaasCustomerId gravado
        if (userBase.asaasCustomerId) {
          // Retornar o asaasCustomerId existente da base
          return {
            asaasCustomerId: userBase.asaasCustomerId,
            userId: userBase.id, // ID do UserBase, não do ClienteMaster
          };
        }
        
        // Não tem asaasCustomerId, precisa criar na Asaas
        asaasCustomerId = await this.asaasService.createCustomer(
          this.prepareAsaasCustomerData(createCustomerDto)
        );
        await this.userBaseService.update(userBase.id, { asaasCustomerId });
        
        return {
          asaasCustomerId,
          userId: userBase.id,
        };
      } else {
        // Cliente não existe, criar novo UserBase
        const hashedPassword = await bcrypt.hash(createCustomerDto.password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
        
        // Criar customer na Asaas primeiro
        asaasCustomerId = await this.asaasService.createCustomer(
          this.prepareAsaasCustomerData(createCustomerDto)
        );

        // Criar UserBase
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
          asaasCustomerId,
        });
      }

      return { 
        asaasCustomerId,
        userId: userBase.id,
      };
    } catch (error: any) {
      if (error instanceof ConflictException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
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
   * Prepara dados do customer para enviar à Asaas
   */
  private prepareAsaasCustomerData(createCustomerDto: CreateCustomerDto) {
    return {
      name: createCustomerDto.name,
      email: createCustomerDto.email,
      cpfCnpj: createCustomerDto.cpf.replace(/\D/g, ''),
      phone: createCustomerDto.phone.replace(/\D/g, ''),
      postalCode: createCustomerDto.postalCode.replace(/\D/g, ''),
      address: createCustomerDto.address,
      addressNumber: createCustomerDto.addressNumber,
      complement: createCustomerDto.complement,
      province: createCustomerDto.province,
      city: createCustomerDto.city,
      state: createCustomerDto.state,
    };
  }

  /**
   * Garante que o customer existe na Asaas (cria ou atualiza)
   */
  private async ensureAsaasCustomer(
    userBase: any,
    createCustomerDto: CreateCustomerDto,
  ): Promise<string> {
    const customerData = this.prepareAsaasCustomerData(createCustomerDto);
    
    if (userBase.asaasCustomerId) {
      try {
        await this.asaasService.updateCustomer(userBase.asaasCustomerId, customerData);
        return userBase.asaasCustomerId;
      } catch (error: any) {
        console.error('Erro ao atualizar customer na Asaas:', error);
        // Continua mesmo se der erro na atualização
        return userBase.asaasCustomerId;
      }
    } else {
      const asaasCustomerId = await this.asaasService.createCustomer(customerData);
      await this.userBaseService.update(userBase.id, { asaasCustomerId });
      return asaasCustomerId;
    }
  }

  /**
   * Atualiza dados do UserBase existente
   */
  private async updateExistingUserBase(
    userBase: any,
    createCustomerDto: CreateCustomerDto,
    telefoneNormalizado: string,
    asaasCustomerId: string,
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
      asaasCustomerId,
    };

    if (createCustomerDto.password) {
      updateData.password = await bcrypt.hash(createCustomerDto.password, 10);
    }

    await this.userBaseService.update(userBase.id, updateData);
  }

  /**
   * Processa atualização de customer existente sem assinatura
   */
  private async handleExistingCustomerWithoutSubscription(
    userBase: any,
    createCustomerDto: CreateCustomerDto,
    telefoneNormalizado: string,
  ): Promise<{ asaasCustomerId: string; userId: string }> {
    const asaasCustomerId = await this.ensureAsaasCustomer(userBase, createCustomerDto);
    await this.updateExistingUserBase(userBase, createCustomerDto, telefoneNormalizado, asaasCustomerId);
    
    return {
      asaasCustomerId,
      userId: userBase.id,
    };
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
    // 1. Buscar UserBase pelo userId
    const userBase = await this.userBaseService.findById(checkoutDto.userId);
    if (!userBase) {
      throw new NotFoundException('Usuário não encontrado');
    }

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

    // 4. Obter ou criar asaasCustomerId
    let asaasCustomerId: string;
    
    // IDs dos planos de teste que devem gerar dados fake
    const PLANOS_TESTE = [
      '677c76e6-0ab0-4626-87bd-23f13ad2cd76', // Plano Teste Analises
      'ca772fbf-d9c7-4ef7-9f6c-84e535c393f0', // Plano Teste
    ];
    const isPlanoTeste = PLANOS_TESTE.includes(checkoutDto.planoId);
    
    if (userBase.asaasCustomerId) {
      asaasCustomerId = userBase.asaasCustomerId;
    } else if (isPlanoTeste) {
      // Para planos de teste, permitir sem asaasCustomerId
      asaasCustomerId = `cus_fake_test_${userBase.id}`;
    } else {
      throw new BadRequestException(
        `Usuário não possui Id de pagamentos no gateway.`,
      );
    }

    // 5. Buscar plano e calcular valor
    const plano = await this.planosService.findById(checkoutDto.planoId);
    if (!plano) {
      throw new NotFoundException('Plano não encontrado');
    }

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
      }
    }

    if (!valorFinal || valorFinal <= 0) {
      throw new BadRequestException(
        'O valor da assinatura deve ser maior que zero. Verifique o valor do plano.',
      );
    }

    // 6. Tokenizar cartão se necessário
    let creditCardToken: string | null = null;
    let creditCardNumber: string | null = null;
    let creditCardBrand: string | null = null;

    if (checkoutDto.billingType === 'CREDIT_CARD') {
      // Se o frontend já passou o token tokenizado, usar ele diretamente
      if (checkoutDto.creditCardToken) {
        creditCardToken = checkoutDto.creditCardToken;
        // Se não tiver número e bandeira, tentar obter do token ou deixar null
        creditCardNumber = checkoutDto.creditCardNumber || null;
        creditCardBrand = checkoutDto.creditCardBrand || null;
      } else {
       
        if (
          !checkoutDto.creditCardHolderName ||
          !checkoutDto.creditCardNumber ||
          !checkoutDto.creditCardExpiryMonth ||
          !checkoutDto.creditCardExpiryYear ||
          !checkoutDto.creditCardCcv
        ) {
          throw new BadRequestException('Dados do cartão de crédito são obrigatórios ou forneça creditCardToken');
        }


      }
    }

    // 7. Processar pagamento (apenas para planos de teste - cobrança fake imediata)
    // Planos normais: período grátis de 7 dias (sem cobrança no checkout)
    let paymentResult: any = null;
    
    if (isPlanoTeste && checkoutDto.billingType === 'CREDIT_CARD') {
      // Planos de teste: processar cobrança fake imediata (comportamento original)
      console.log('🧪 Modo TESTE: Criando pagamento e assinatura fake para plano de teste');
      const dueDateString = this.getDataAtualBrasil();
      const paymentDateString = this.getDataAtualBrasil();
      
      // Criar paymentResult fake
      paymentResult = {
        id: `pay_fake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customer: asaasCustomerId || 'cus_fake_test',
        value: valorFinal,
        netValue: valorFinal,
        originalValue: valorFinal,
        interestValue: 0,
        description: `Pagamento TESTE - ${plano.nome}`,
        billingType: 'CREDIT_CARD',
        status: 'CONFIRMED',
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

      // Registrar cobrança fake
      await this.registrarCobranca({
        userId: null, // null porque ClienteMaster ainda não foi criado
        asaasPaymentId: paymentResult.id,
        asaasCustomerId: asaasCustomerId,
        value: valorFinal,
        billingType: 'CREDIT_CARD',
        status: paymentResult.status,
        dueDate: paymentResult.dueDate ? this.parseDataBrasil(paymentResult.dueDate) : null,
        paymentDate: paymentResult.paymentDate ? this.parseDataBrasil(paymentResult.paymentDate) : null,
        asaasResponse: JSON.stringify(paymentResult),
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
    } else if (checkoutDto.billingType === 'CREDIT_CARD') {
      // Planos normais: apenas validar token (não processar pagamento - período grátis)
      if (!creditCardToken) {
        throw new BadRequestException('Token do cartão é obrigatório para processar a primeira cobrança após o período grátis');
      }
      console.log('✅ Token do cartão validado. Período grátis de 7 dias ativado. Primeira cobrança será processada automaticamente após 7 dias.');
    }

    // 8. Criar ClienteMaster
    if (!clienteMaster) {
      clienteMaster = await this.clientesMasterService.create({
        userId: userBase.id,
      });
      if (isPlanoTeste) {
        console.log('✅ ClienteMaster criado para plano de teste:', clienteMaster.id);
      } else {
        console.log('✅ ClienteMaster criado. Período grátis de 7 dias ativado:', clienteMaster.id);
      }
    }

    // 9. Criar assinatura no banco de dados
    // Planos de teste: próximo mês (comportamento original)
    // Planos normais: 7 dias grátis
    const nextDueDateString = isPlanoTeste 
      ? this.calcularProximoMes() 
      : this.calcularProximos7Dias();
    const nextDueDate = this.parseDataBrasil(nextDueDateString);

    const assinaturaData: Partial<Assinatura> = {
      userId: clienteMaster.id,
      asaasCustomerId: asaasCustomerId,
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
    };
    const assinatura = this.assinaturaRepository.create(assinaturaData);

    try {
      const savedSubscription = await this.assinaturaRepository.save(assinatura);
      await this.gerenciarRecorrencia(savedSubscription);

      // 10. Atualizar cobrança com userId e assinaturaId (apenas para planos de teste)
      if (isPlanoTeste && paymentResult && (paymentResult.status === 'CONFIRMED' || paymentResult.status === 'RECEIVED')) {
        const cobranca = await this.cobrancaRepository.findOne({
          where: { asaasPaymentId: paymentResult.id },
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
          asaasCustomerId: asaasCustomerId,
        };
      } else {
        console.log('✅ Assinatura criada com sucesso. Período grátis de 7 dias ativado:', savedSubscription.id);
        console.log(`📅 Primeira cobrança será processada automaticamente em: ${nextDueDateString}`);

        return {
          statusCode: 200,
          message: 'Assinatura criada com sucesso! Período grátis de 7 dias ativado.',
          data: {
            assinatura: this.toResponseDto(savedSubscription),
            periodoGratis: {
              ativo: true,
              diasRestantes: 7,
              primeiraCobranca: nextDueDateString,
              mensagem: 'A primeira cobrança será processada automaticamente após 7 dias.',
            },
          },
          asaasCustomerId: asaasCustomerId,
        };
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Erro ao salvar assinatura no banco de dados: ${error.message || 'Erro desconhecido'}`,
      );
    }
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
      nextDueDate: subscription.nextDueDate,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
