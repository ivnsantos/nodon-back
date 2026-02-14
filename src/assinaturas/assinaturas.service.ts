import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
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
import { ChatService } from '../chat/chat.service';

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

    console.log('💰 Valor final que será enviado ao Asaas:', valorFinal);

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
    // Garantir que o valor seja um número (converter de decimal para número)
    const valorParaAsaas = Number(valorFinal);
    
    console.log('📤 Enviando para Asaas:', {
      customer: asaasCustomerId,
      billingType: createSubscriptionDto.billingType,
      value: valorParaAsaas,
      planoNome: plano.nome,
      planoId: plano.id,
    });
    
    const subscriptionData: any = {
      customer: asaasCustomerId,
      billingType: createSubscriptionDto.billingType,
      value: valorParaAsaas, // Valor do plano (valorPromocional ou valorOriginal)
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

    // 7. Criar UserBase (usuário) primeiro - email é único
    const hashedPassword = await bcrypt.hash(createSubscriptionDto.password, 10);
    let userBase;
    try {
      // Verificar se já existe UserBase com este email (email é único)
      const existingUserBase = await this.userBaseService.findByEmail(createSubscriptionDto.email);
      
      if (existingUserBase) {
        throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
      }

      // Verificar se já existe conta verificada com este email em outras tabelas
      const existingClienteMaster = await this.clientesMasterService.findByEmail(createSubscriptionDto.email);
      // Verificação de User removida - usar apenas UserBase
      
      // Se já existe uma conta verificada, a nova conta nasce verificada
      // Buscar UserBase diretamente se ClienteMaster existir
      let emailJaVerificado = false;
      if (existingClienteMaster) {
        const userBaseDoCliente = await this.userBaseService.findById(existingClienteMaster.userId);
        emailJaVerificado = userBaseDoCliente?.isVerified || false;
      }

      // Gerar código de verificação (6 dígitos) - só se email não estiver verificado
      let verificationToken: string | null = null;
      let tokenExpiresAt: Date | null = null;
      let isVerified = false;

      if (emailJaVerificado) {
        // Email já verificado em outra conta, nova conta nasce verificada
        isVerified = true;
      } else {
        // Email não verificado, precisa gerar código
        verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        tokenExpiresAt = new Date();
        tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
      }

      // Criar UserBase com dados pessoais e de endereço
      // No processo de assinatura, não envia email de verificação
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
        isVerified,
        verificationToken,
        tokenExpiresAt,
      });

      // Não enviar email de verificação durante o processo de assinatura
      // O email de verificação será enviado apenas quando o usuário solicitar
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Erro ao criar usuário: ${error.message || 'Erro desconhecido'}`,
      );
    }

    // 8. Criar ClienteMaster vinculado ao UserBase
    // nomeEmpresa não é preenchido na criação - será preenchido depois pelo próprio cliente via API
    let clienteMaster;
    try {
      clienteMaster = await this.clientesMasterService.create({
        userId: userBase.id,
        // nomeEmpresa não é preenchido - será atualizado depois pelo cliente via POST /clientes-master/meus-dados
        // Outros campos da empresa serão preenchidos depois pelo cliente
      });
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Erro ao criar cliente master: ${error.message || 'Erro desconhecido'}`,
      );
    }

    // 9. Salva assinatura no banco de dados
    const assinaturaData: Partial<Assinatura> = {
      userId: clienteMaster.id,
      planoId: createSubscriptionDto.planoId,
      couponId: couponId || undefined,
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
      creditCardToken: creditCardToken ?? undefined,
      creditCardNumber: creditCardNumber ?? undefined,
      creditCardBrand: creditCardBrand ?? undefined,
      status: 'PENDING',
      asaasResponse: JSON.stringify(asaasSubscription),
      nextDueDate: this.parseNextDueDate(asaasSubscription.nextDueDate),
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

    // 4. Buscar assinatura existente para reutilizar asaasCustomerId se houver
    const existingSubscription = await this.assinaturaRepository.findOne({
      where: { userId: clienteMaster.id },
      order: { createdAt: 'DESC' },
    });

    // 5. Criar ou atualizar cliente na ASAAS
    let asaasCustomerId: string;
    if (existingSubscription && existingSubscription.asaasCustomerId) {
      // Usar o customer ID existente
      asaasCustomerId = existingSubscription.asaasCustomerId;
    } else {
      // Criar novo cliente na ASAAS
      asaasCustomerId = await this.asaasService.createCustomer({
        name: userBase.nome,
        email: userBase.email,
        cpfCnpj: userBase.cpf.replace(/\D/g, ''), // Remove formatação
        phone: userBase.telefone.replace(/\D/g, ''), // Remove formatação
        postalCode: userBase.postalCode.replace(/\D/g, ''), // Remove formatação
        address: userBase.address,
        addressNumber: userBase.addressNumber || '',
        complement: userBase.complement || '',
        province: userBase.province || '',
        city: userBase.city,
        state: userBase.state,
      });
    }

    // 6. Tokeniza cartão de crédito se necessário
    let creditCardToken: string | null = null;
    let creditCardNumber: string | null = null;
    let creditCardBrand: string | null = null;

    if (createSimpleSubscriptionDto.billingType === 'CREDIT_CARD') {
      if (
        !createSimpleSubscriptionDto.creditCardHolderName ||
        !createSimpleSubscriptionDto.creditCardNumber ||
        !createSimpleSubscriptionDto.creditCardExpiryMonth ||
        !createSimpleSubscriptionDto.creditCardExpiryYear ||
        !createSimpleSubscriptionDto.creditCardCcv
      ) {
        throw new BadRequestException('Dados do cartão de crédito são obrigatórios');
      }

      try {
        const tokenizedCard = await this.asaasService.tokenizeCreditCard({
          customer: asaasCustomerId,
          creditCard: {
            holderName: createSimpleSubscriptionDto.creditCardHolderName,
            number: createSimpleSubscriptionDto.creditCardNumber,
            expiryMonth: createSimpleSubscriptionDto.creditCardExpiryMonth,
            expiryYear: createSimpleSubscriptionDto.creditCardExpiryYear,
            ccv: createSimpleSubscriptionDto.creditCardCcv,
          },
          creditCardHolderInfo: {
            name: userBase.nome,
            email: userBase.email,
            cpfCnpj: userBase.cpf.replace(/\D/g, ''),
            postalCode: userBase.postalCode.replace(/\D/g, ''),
            addressNumber: userBase.addressNumber || '',
            addressComplement: userBase.complement || null,
            phone: userBase.telefone.replace(/\D/g, ''),
            mobilePhone: userBase.telefone.replace(/\D/g, ''),
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

    // 7. Prepara dados da assinatura com desconto se cupom válido
    const subscriptionData: any = {
      customer: asaasCustomerId,
      billingType: createSimpleSubscriptionDto.billingType,
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
    if (createSimpleSubscriptionDto.billingType === 'CREDIT_CARD') {
      subscriptionData.creditCard = {
        creditCardHolderName: createSimpleSubscriptionDto.creditCardHolderName,
        creditCardHolderEmail: userBase.email,
        creditCardHolderCpfCnpj: userBase.cpf.replace(/\D/g, ''),
        creditCardHolderPhone: userBase.telefone.replace(/\D/g, ''),
        creditCardHolderPostalCode: userBase.postalCode.replace(/\D/g, ''),
        creditCardHolderAddress: userBase.address,
        creditCardHolderAddressNumber: userBase.addressNumber || '',
        creditCardHolderAddressComplement: userBase.complement || '',
        creditCardHolderProvince: userBase.province || '',
        creditCardHolderCity: userBase.city,
        creditCardHolderState: userBase.state,
      };
    }

    // 8. Cria assinatura na ASAAS
    const asaasSubscription = await this.asaasService.createSubscription(subscriptionData);

    // 9. Salva assinatura no banco de dados
    const assinaturaData: Partial<Assinatura> = {
      userId: clienteMaster.id,
      planoId: createSimpleSubscriptionDto.planoId,
      couponId: couponId || undefined,
      asaasCustomerId,
      asaasSubscriptionId: asaasSubscription.id,
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
      creditCardToken: creditCardToken ?? undefined,
      creditCardNumber: creditCardNumber ?? undefined,
      creditCardBrand: creditCardBrand ?? undefined,
      status: 'PENDING',
      asaasResponse: JSON.stringify(asaasSubscription),
      nextDueDate: this.parseNextDueDate(asaasSubscription.nextDueDate),
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
