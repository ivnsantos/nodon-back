"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssinaturasService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const assinatura_entity_1 = require("./entities/assinatura.entity");
const recorrencia_entity_1 = require("./entities/recorrencia.entity");
const cobranca_entity_1 = require("./entities/cobranca.entity");
const cupom_entity_1 = require("../cupons/entities/cupom.entity");
const asaas_service_1 = require("./services/asaas.service");
const planos_service_1 = require("../planos/planos.service");
const cupons_service_1 = require("../cupons/cupons.service");
const clientes_master_service_1 = require("../users/clientes-master.service");
const users_service_1 = require("../users/users.service");
const user_base_service_1 = require("../users/services/user-base.service");
const user_comum_service_1 = require("../users/services/user-comum.service");
const historico_mensal_entity_1 = require("../analises/entities/historico-mensal.entity");
const chat_service_1 = require("../chat/chat.service");
const newrelic_logger_1 = require("../common/utils/newrelic-logger");
const queue_service_1 = require("../queue/queue.service");
let AssinaturasService = class AssinaturasService {
    assinaturaRepository;
    recorrenciaRepository;
    cobrancaRepository;
    cupomRepository;
    historicoRepository;
    asaasService;
    planosService;
    cuponsService;
    clientesMasterService;
    usersService;
    userBaseService;
    userComumService;
    chatService;
    queueService;
    constructor(assinaturaRepository, recorrenciaRepository, cobrancaRepository, cupomRepository, historicoRepository, asaasService, planosService, cuponsService, clientesMasterService, usersService, userBaseService, userComumService, chatService, queueService) {
        this.assinaturaRepository = assinaturaRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.cobrancaRepository = cobrancaRepository;
        this.cupomRepository = cupomRepository;
        this.historicoRepository = historicoRepository;
        this.asaasService = asaasService;
        this.planosService = planosService;
        this.cuponsService = cuponsService;
        this.clientesMasterService = clientesMasterService;
        this.usersService = usersService;
        this.userBaseService = userBaseService;
        this.userComumService = userComumService;
        this.chatService = chatService;
        this.queueService = queueService;
    }
    async create(createSubscriptionDto) {
        let coupon = null;
        let couponId = null;
        if (createSubscriptionDto.couponName) {
            coupon = await this.cuponsService.findByName(createSubscriptionDto.couponName);
            if (!coupon) {
                throw new common_1.BadRequestException('CUPOM INVALIDO');
            }
            if (!coupon.active) {
                throw new common_1.BadRequestException('CUPOM INVALIDO');
            }
            couponId = coupon.id;
        }
        const plano = await this.planosService.findById(createSubscriptionDto.planoId);
        if (!plano) {
            throw new common_1.NotFoundException('Plano não encontrado');
        }
        const valorBasePlano = plano.valorPromocional ?? plano.valorOriginal ?? null;
        console.log('💰 Valor do plano:', {
            planoId: plano.id,
            planoNome: plano.nome,
            valorOriginal: plano.valorOriginal,
            valorPromocional: plano.valorPromocional,
            valorBaseUsado: valorBasePlano,
        });
        if (!valorBasePlano || valorBasePlano === null || Number(valorBasePlano) <= 0) {
            throw new common_1.BadRequestException(`O plano "${plano.nome}" não possui valor configurado. Configure valorOriginal ou valorPromocional no plano antes de criar assinaturas.`);
        }
        let valorFinal = Number(valorBasePlano);
        if (coupon && coupon.active) {
            const desconto = (valorFinal * Number(coupon.discountValue)) / 100;
            valorFinal = valorFinal - desconto;
            if (valorFinal < 0)
                valorFinal = 0;
            console.log('🎫 Cupom aplicado:', {
                cupomNome: coupon.name,
                descontoPercentual: coupon.discountValue,
                valorAntes: Number(valorBasePlano),
                valorDepois: valorFinal,
            });
        }
        if (!valorFinal || valorFinal <= 0) {
            throw new common_1.BadRequestException('O valor da assinatura deve ser maior que zero. Verifique o valor do plano.');
        }
        console.log('💰 Valor final da assinatura:', valorFinal);
        let clienteMaster;
        let userBase;
        try {
            const existingClienteMaster = await this.clientesMasterService.findByEmail(createSubscriptionDto.email);
            if (existingClienteMaster) {
                clienteMaster = existingClienteMaster;
                userBase = await this.userBaseService.findById(existingClienteMaster.userId);
                if (!userBase) {
                    throw new common_1.InternalServerErrorException('UserBase não encontrado para o ClienteMaster existente');
                }
                const existingActiveSubscription = await this.assinaturaRepository.findOne({
                    where: {
                        userId: clienteMaster.id,
                        status: 'ACTIVE',
                    },
                });
                if (existingActiveSubscription) {
                    throw new common_1.BadRequestException('Assinatura ativa. Fale com o Suporte.');
                }
            }
            else {
                const hashedPassword = await bcrypt.hash(createSubscriptionDto.password, 10);
                const existingUserBase = await this.userBaseService.findByEmail(createSubscriptionDto.email);
                if (existingUserBase) {
                    throw new common_1.ConflictException('Já existe um usuário cadastrado com este e-mail');
                }
                const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
                const tokenExpiresAt = new Date();
                tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
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
                clienteMaster = await this.clientesMasterService.create({
                    userId: userBase.id,
                });
            }
        }
        catch (error) {
            if (error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Erro ao criar/obter cliente: ${error.message || 'Erro desconhecido'}`);
        }
        let asaasCustomerId;
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
        }
        catch (error) {
            throw new common_1.BadRequestException(`Erro ao criar cliente na ASAAS: ${error.message || 'Erro desconhecido'}`);
        }
        let creditCardToken = null;
        let creditCardNumber = null;
        let creditCardBrand = null;
        if (createSubscriptionDto.billingType === 'CREDIT_CARD') {
            if (!createSubscriptionDto.creditCardToken) {
                throw new common_1.BadRequestException('Token do cartão de crédito é obrigatório. A tokenização deve ser feita no frontend.');
            }
            creditCardToken = createSubscriptionDto.creditCardToken;
            creditCardNumber = createSubscriptionDto.creditCardNumber || null;
            creditCardBrand = createSubscriptionDto.creditCardBrand || null;
        }
        let paymentResult = null;
        if (createSubscriptionDto.billingType === 'CREDIT_CARD') {
            if (!creditCardToken) {
                throw new common_1.BadRequestException('Token do cartão não foi gerado');
            }
            try {
                const dueDateString = this.getDataAtualBrasil();
                paymentResult = await this.asaasService.createPayment({
                    billingType: 'CREDIT_CARD',
                    customer: asaasCustomerId,
                    value: valorFinal,
                    dueDate: dueDateString,
                    creditCardToken: creditCardToken,
                });
                const statusConfirmado = paymentResult.status === 'CONFIRMED' || paymentResult.status === 'RECEIVED';
                await this.registrarCobranca({
                    userId: statusConfirmado ? clienteMaster.id : null,
                    asaasPaymentId: paymentResult.id,
                    asaasCustomerId: asaasCustomerId,
                    value: valorFinal,
                    billingType: 'CREDIT_CARD',
                    status: paymentResult.status,
                    dueDate: paymentResult.dueDate ? this.parseDataBrasil(paymentResult.dueDate) : null,
                    paymentDate: paymentResult.paymentDate ? this.parseDataBrasil(paymentResult.paymentDate) : null,
                    asaasResponse: JSON.stringify(paymentResult),
                    assinaturaId: null,
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
                        userId: clienteMaster.id,
                    }),
                });
                if (!statusConfirmado) {
                    console.log('⚠️ Pagamento criado mas não aprovado ainda. Status:', paymentResult.status);
                    console.log('📝 Cobrança registrada com userId=null. Será atualizada quando status mudar para CONFIRMED.');
                    (0, newrelic_logger_1.newRelicLog)('warn', 'Pagamento criado mas não aprovado', {
                        asaasPaymentId: paymentResult.id,
                        status: paymentResult.status,
                        valor: valorFinal,
                        customerId: asaasCustomerId,
                        planoId: createSubscriptionDto.planoId,
                    });
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
                (0, newrelic_logger_1.newRelicLog)('info', 'Pagamento avulso processado na criação de assinatura', {
                    asaasPaymentId: paymentResult.id,
                    status: paymentResult.status,
                    valor: valorFinal,
                    customerId: asaasCustomerId,
                    planoId: createSubscriptionDto.planoId,
                    aprovado: statusConfirmado,
                });
            }
            catch (error) {
                console.error('❌ Erro ao processar pagamento:', error);
                (0, newrelic_logger_1.newRelicLog)('error', 'Erro ao processar pagamento na criação de assinatura', {
                    error: error.message,
                    customerId: asaasCustomerId,
                    valor: valorFinal,
                    planoId: createSubscriptionDto.planoId,
                });
                throw new common_1.BadRequestException(`Erro ao processar pagamento: ${error.message || 'Erro desconhecido'}`);
            }
        }
        const nextDueDateString = this.calcularProximos7Dias();
        const nextDueDate = this.parseDataBrasil(nextDueDateString);
        const assinaturaData = {
            userId: clienteMaster.id,
            asaasCustomerId: asaasCustomerId,
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
            if (paymentResult && (paymentResult.status === 'CONFIRMED' || paymentResult.status === 'RECEIVED')) {
                const cobranca = await this.cobrancaRepository.findOne({
                    where: { asaasPaymentId: paymentResult.id },
                });
                if (cobranca) {
                    cobranca.assinaturaId = savedSubscription.id;
                    if (!cobranca.userId) {
                        cobranca.userId = savedSubscription.userId;
                    }
                    await this.cobrancaRepository.save(cobranca);
                    console.log(`✅ Assinatura ${savedSubscription.id} vinculada à cobrança ${cobranca.id} no checkout`);
                }
            }
            console.log('✅ Assinatura criada com sucesso:', savedSubscription.id);
            (0, newrelic_logger_1.newRelicLog)('info', 'Assinatura criada com sucesso', {
                assinaturaId: savedSubscription.id,
                userId: savedSubscription.userId,
                planoId: savedSubscription.planoId,
                valor: savedSubscription.value,
                billingType: savedSubscription.billingType,
                status: savedSubscription.status,
                couponId: couponId || null,
                pagamentoAprovado: paymentResult?.status === 'CONFIRMED' || paymentResult?.status === 'RECEIVED',
                asaasPaymentId: paymentResult?.id || null,
            });
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
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Erro ao salvar assinatura no banco de dados: ${error.message || 'Erro desconhecido'}`);
        }
    }
    async createSimple(createSimpleSubscriptionDto, user) {
        const userBase = await this.userBaseService.findByEmail(user.email);
        if (!userBase) {
            throw new common_1.NotFoundException('Usuário não encontrado');
        }
        const clienteMaster = await this.clientesMasterService.create({
            userId: userBase.id,
        });
        if (!userBase.cpf || !userBase.telefone || !userBase.postalCode || !userBase.address) {
            throw new common_1.BadRequestException('Dados incompletos. Por favor, complete seu cadastro com CPF, telefone e endereço antes de criar uma assinatura.');
        }
        let coupon = null;
        let couponId = null;
        if (createSimpleSubscriptionDto.couponName) {
            coupon = await this.cuponsService.findByName(createSimpleSubscriptionDto.couponName);
            if (!coupon) {
                throw new common_1.BadRequestException('CUPOM INVALIDO');
            }
            if (!coupon.active) {
                throw new common_1.BadRequestException('CUPOM INVALIDO');
            }
            couponId = coupon.id;
        }
        const plano = await this.planosService.findById(createSimpleSubscriptionDto.planoId);
        if (!plano) {
            throw new common_1.NotFoundException('Plano não encontrado');
        }
        let valorFinal = plano.valorPromocional || plano.valorOriginal;
        if (coupon && coupon.active) {
            const desconto = (valorFinal * Number(coupon.discountValue)) / 100;
            valorFinal = valorFinal - desconto;
            if (valorFinal < 0)
                valorFinal = 0;
        }
        let creditCardToken = null;
        let creditCardNumber = null;
        let creditCardBrand = null;
        if (createSimpleSubscriptionDto.billingType === 'CREDIT_CARD') {
            if (!createSimpleSubscriptionDto.creditCardToken) {
                throw new common_1.BadRequestException('Token do cartão de crédito é obrigatório. A tokenização deve ser feita no frontend.');
            }
            creditCardToken = createSimpleSubscriptionDto.creditCardToken;
            creditCardNumber = createSimpleSubscriptionDto.creditCardNumber || null;
            creditCardBrand = createSimpleSubscriptionDto.creditCardBrand || null;
        }
        const nextDueDateString = this.calcularProximos7Dias();
        const nextDueDate = this.parseDataBrasil(nextDueDateString);
        const assinaturaData = {
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
            await this.gerenciarRecorrencia(savedSubscription);
            (0, newrelic_logger_1.newRelicLog)('info', 'Assinatura simples criada com sucesso', {
                assinaturaId: savedSubscription.id,
                userId: savedSubscription.userId,
                planoId: savedSubscription.planoId,
                valor: savedSubscription.value,
                billingType: savedSubscription.billingType,
                status: savedSubscription.status,
                couponId: couponId || null,
            });
            return this.toResponseDto(savedSubscription);
        }
        catch (error) {
            (0, newrelic_logger_1.newRelicLog)('error', 'Erro ao salvar assinatura simples', {
                error: error.message,
                userId: clienteMaster.id,
                planoId: createSimpleSubscriptionDto.planoId,
            });
            throw new common_1.InternalServerErrorException(`Erro ao salvar assinatura no banco de dados: ${error.message || 'Erro desconhecido'}`);
        }
    }
    async findByUserId(userId) {
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
    async checkFirstPaymentStatus(userId) {
        const subscription = await this.assinaturaRepository.findOne({
            where: { userId },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Assinatura não encontrada para este usuário');
        }
        if (!subscription.asaasSubscriptionId) {
            throw new common_1.BadRequestException('Assinatura não possui ID da ASAAS');
        }
        try {
            const paymentsResponse = await this.asaasService.getSubscriptionPayments(subscription.asaasSubscriptionId);
            if (!paymentsResponse.data || paymentsResponse.data.length === 0) {
                return { status: 'NO_PAYMENTS' };
            }
            const firstPayment = paymentsResponse.data[0];
            const paymentStatus = firstPayment.status;
            if (paymentStatus === 'CONFIRMED') {
                subscription.status = 'ACTIVE';
                if (!subscription.nextDueDate) {
                    subscription.nextDueDate = this.parseDataBrasil(this.calcularProximoMes());
                }
                await this.assinaturaRepository.save(subscription);
                await this.gerenciarRecorrencia(subscription);
                return { status: 'CONFIRMED' };
            }
            return { status: paymentStatus };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Erro ao verificar status do pagamento: ${error.message || 'Erro desconhecido'}`);
        }
    }
    async atualizarCobrancaComStatusAsaas(paymentId) {
        const paymentStatusResponse = await this.asaasService.getPaymentStatus(paymentId);
        const novoStatus = paymentStatusResponse.status;
        const cobranca = await this.cobrancaRepository.findOne({
            where: { asaasPaymentId: paymentId },
        });
        if (!cobranca) {
            throw new common_1.NotFoundException('Cobrança não encontrada para este pagamento');
        }
        let paymentData = null;
        try {
            paymentData = await this.asaasService.getPayment(paymentId);
        }
        catch (error) {
            console.error('Erro ao buscar dados completos do pagamento:', error);
        }
        const statusMudou = cobranca.status !== novoStatus;
        let precisaAtualizar = statusMudou;
        if (paymentData) {
            if (paymentData.paymentDate) {
                const novoPaymentDate = this.parseDataBrasil(paymentData.paymentDate);
                if (!cobranca.paymentDate || cobranca.paymentDate.getTime() !== novoPaymentDate?.getTime()) {
                    cobranca.paymentDate = novoPaymentDate;
                    precisaAtualizar = true;
                }
            }
            if (paymentData.dueDate) {
                const novoDueDate = this.parseDataBrasil(paymentData.dueDate);
                if (!cobranca.dueDate || cobranca.dueDate.getTime() !== novoDueDate?.getTime()) {
                    cobranca.dueDate = novoDueDate;
                    precisaAtualizar = true;
                }
            }
            const novaResposta = JSON.stringify(paymentData);
            if (cobranca.asaasResponse !== novaResposta) {
                cobranca.asaasResponse = novaResposta;
                precisaAtualizar = true;
            }
        }
        if (statusMudou) {
            console.log(`🔄 Status da cobrança ${paymentId} mudou: ${cobranca.status} → ${novoStatus}`);
            cobranca.status = novoStatus;
        }
        if (precisaAtualizar) {
            await this.cobrancaRepository.save(cobranca);
            console.log(`✅ Cobrança ${paymentId} atualizada com sucesso`);
        }
        return cobranca;
    }
    async checkPaymentStatus(paymentId) {
        try {
            const cobranca = await this.atualizarCobrancaComStatusAsaas(paymentId);
            const status = cobranca.status;
            if ((status === 'CONFIRMED' || status === 'RECEIVED') && !cobranca.assinaturaId) {
                if (!cobranca.userId && cobranca.dadosAssinatura) {
                    try {
                        const dadosAssinatura = JSON.parse(cobranca.dadosAssinatura);
                        if (dadosAssinatura.userId) {
                            cobranca.userId = dadosAssinatura.userId;
                            await this.cobrancaRepository.save(cobranca);
                            console.log(`✅ userId vinculado à cobrança ${paymentId}: ${dadosAssinatura.userId}`);
                        }
                    }
                    catch (error) {
                        console.error('Erro ao buscar userId dos dados da assinatura:', error);
                    }
                }
                if (cobranca.userId) {
                    await this.criarAssinaturaAPartirDaCobranca(cobranca);
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
                }
                else {
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
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Erro ao verificar status do pagamento: ${error.message || 'Erro desconhecido'}`);
        }
    }
    async criarAssinaturaAPartirDaCobranca(cobranca) {
        if (!cobranca.dadosAssinatura || !cobranca.planoId) {
            throw new common_1.BadRequestException('Dados insuficientes para criar assinatura');
        }
        if (!cobranca.userId) {
            throw new common_1.BadRequestException('Cobrança não possui userId vinculado. Não é possível criar assinatura.');
        }
        const dadosAssinatura = JSON.parse(cobranca.dadosAssinatura);
        const nextDueDateString = this.calcularProximos7Dias();
        const nextDueDate = this.parseDataBrasil(nextDueDateString);
        const assinaturaData = {
            userId: cobranca.userId,
            asaasCustomerId: cobranca.asaasCustomerId,
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
        await this.gerenciarRecorrencia(savedSubscription);
        cobranca.assinaturaId = savedSubscription.id;
        if (!cobranca.userId) {
            cobranca.userId = savedSubscription.userId;
        }
        await this.cobrancaRepository.save(cobranca);
        console.log(`✅ Assinatura ${savedSubscription.id} criada e vinculada à cobrança ${cobranca.id}`);
        console.log('✅ Assinatura criada a partir da cobrança:', savedSubscription.id);
        return savedSubscription;
    }
    async findById(id) {
        const subscription = await this.assinaturaRepository.findOne({
            where: { id },
            relations: ['plano', 'cupom'],
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Assinatura não encontrada');
        }
        return this.toResponseDto(subscription);
    }
    async getDashboardInfo(clienteMasterId, userTipo) {
        const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        const assinaturaEntity = await this.assinaturaRepository.findOne({
            where: { userId: clienteMaster.id },
            relations: ['plano'],
            order: { createdAt: 'DESC' },
        });
        let plano = null;
        if (assinaturaEntity && assinaturaEntity.planoId) {
            plano = await this.planosService.findById(assinaturaEntity.planoId);
        }
        let quantidadeUsuarios = 0;
        if (userTipo === 'master') {
            const usuarios = await this.usersService.findAllByClienteMaster(clienteMasterId);
            quantidadeUsuarios = usuarios.length;
        }
        const agora = new Date();
        let dataInicioAssinatura = null;
        let dataFimAssinatura = null;
        let proximaRenovacao = null;
        if (assinaturaEntity) {
            if (assinaturaEntity.nextDueDate) {
                dataInicioAssinatura = this.parseNextDueDate(assinaturaEntity.nextDueDate);
                if (dataInicioAssinatura) {
                    dataFimAssinatura = new Date(dataInicioAssinatura);
                    dataFimAssinatura.setMonth(dataFimAssinatura.getMonth() + 1);
                    proximaRenovacao = dataFimAssinatura.toISOString().split('T')[0];
                }
            }
            else if (assinaturaEntity.createdAt) {
                dataInicioAssinatura = new Date(assinaturaEntity.createdAt);
                const diaFaturamento = dataInicioAssinatura.getDate();
                const mesesDesdeInicio = Math.floor((agora.getTime() - dataInicioAssinatura.getTime()) / (1000 * 60 * 60 * 24 * 30));
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
        const ano = agora.getFullYear();
        const mes = agora.getMonth() + 1;
        const historicoAtual = await this.historicoRepository.findOne({
            where: {
                clienteMasterId: clienteMaster.id,
                ano,
                mes,
            },
        });
        const todosHistoricos = await this.historicoRepository.find({
            where: { clienteMasterId: clienteMaster.id },
        });
        const tokensChatUsados = await this.chatService.getTotalTokensByClienteMaster(clienteMaster.id);
        let tokensChatUsadosPeriodo = 0;
        let analisesFeitasPeriodo = 0;
        if (dataInicioAssinatura) {
            tokensChatUsadosPeriodo = await this.chatService.getTotalTokensByClienteMasterInPeriod(clienteMaster.id, dataInicioAssinatura, dataFimAssinatura || agora);
            const dataFimComparacao = dataFimAssinatura || agora;
            for (const h of todosHistoricos) {
                const inicioMesHistorico = new Date(h.ano, h.mes - 1, 1);
                const fimMesHistorico = new Date(h.ano, h.mes, 0, 23, 59, 59, 999);
                const temIntersecao = (inicioMesHistorico >= dataInicioAssinatura && inicioMesHistorico <= dataFimComparacao) ||
                    (fimMesHistorico >= dataInicioAssinatura && fimMesHistorico <= dataFimComparacao) ||
                    (inicioMesHistorico <= dataInicioAssinatura && fimMesHistorico >= dataFimComparacao);
                if (temIntersecao) {
                    analisesFeitasPeriodo += Number(h.analisesFeitas || 0);
                }
            }
        }
        else {
            tokensChatUsadosPeriodo = tokensChatUsados;
            analisesFeitasPeriodo = Number(historicoAtual?.analisesFeitas || 0);
        }
        const tokensChatLimite = plano ? Number(plano.tokenChat) : 0;
        const porcentagemUsoTokens = tokensChatLimite > 0
            ? Math.min(100, Math.round((tokensChatUsadosPeriodo / tokensChatLimite) * 100))
            : 0;
        const analisesFeitas = todosHistoricos.reduce((sum, h) => sum + Number(h.analisesFeitas || 0), 0);
        const analisesLimite = plano ? Number(plano.limiteAnalises) : 0;
        const analisesRestantes = Math.max(0, analisesLimite - analisesFeitasPeriodo);
        const porcentagemUsoAnalises = analisesLimite > 0
            ? Math.min(100, Math.round((analisesFeitasPeriodo / analisesLimite) * 100))
            : 0;
        let cartao = null;
        if (assinaturaEntity && assinaturaEntity.creditCardNumber && assinaturaEntity.creditCardBrand) {
            const ultimos4 = assinaturaEntity.creditCardNumber.slice(-4);
            cartao = {
                bandeira: assinaturaEntity.creditCardBrand,
                ultimos4Digitos: ultimos4,
                numeroMascarado: `• • • • • • • • • • • • ${ultimos4}`,
            };
        }
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
        return {
            clienteMasterId: clienteMaster.id,
            tokensChat: {
                tokensUtilizados: tokensChatUsados,
                tokensUtilizadosMes: tokensChatUsadosPeriodo,
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
    async getDashboardInfoUsuario(clienteMasterId, userComum) {
        const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        const userBase = await this.userBaseService.findById(userComum.userId);
        if (!userBase) {
            throw new common_1.NotFoundException('Usuário base não encontrado');
        }
        const assinaturaEntity = await this.assinaturaRepository.findOne({
            where: { userId: clienteMaster.id },
            relations: ['plano'],
            order: { createdAt: 'DESC' },
        });
        let plano = null;
        if (assinaturaEntity && assinaturaEntity.planoId) {
            plano = await this.planosService.findById(assinaturaEntity.planoId);
        }
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
        const agoraPeriodo = new Date();
        let dataInicioAssinatura = null;
        let dataFimAssinatura = null;
        if (assinaturaEntity) {
            if (assinaturaEntity.nextDueDate) {
                dataInicioAssinatura = this.parseNextDueDate(assinaturaEntity.nextDueDate);
                if (dataInicioAssinatura) {
                    dataFimAssinatura = new Date(dataInicioAssinatura);
                    dataFimAssinatura.setMonth(dataFimAssinatura.getMonth() + 1);
                }
            }
            else if (assinaturaEntity.createdAt) {
                dataInicioAssinatura = new Date(assinaturaEntity.createdAt);
                const diaFaturamento = dataInicioAssinatura.getDate();
                const mesesDesdeInicio = Math.floor((agoraPeriodo.getTime() - dataInicioAssinatura.getTime()) / (1000 * 60 * 60 * 24 * 30));
                const proxima = new Date(dataInicioAssinatura);
                proxima.setMonth(proxima.getMonth() + mesesDesdeInicio + 1);
                proxima.setDate(diaFaturamento);
                if (proxima <= agoraPeriodo) {
                    proxima.setMonth(proxima.getMonth() + 1);
                }
                dataFimAssinatura = proxima;
            }
        }
        let tokensChatUsadosPeriodo = 0;
        let analisesFeitasPeriodo = 0;
        if (dataInicioAssinatura) {
            tokensChatUsadosPeriodo = await this.chatService.getTotalTokensByClienteMasterInPeriod(clienteMaster.id, dataInicioAssinatura, dataFimAssinatura || agora);
            const todosHistoricos = await this.historicoRepository.find({
                where: { clienteMasterId: clienteMaster.id },
            });
            const dataFimComparacao = dataFimAssinatura || agora;
            for (const h of todosHistoricos) {
                const inicioMesHistorico = new Date(h.ano, h.mes - 1, 1);
                const fimMesHistorico = new Date(h.ano, h.mes, 0, 23, 59, 59, 999);
                const temIntersecao = (inicioMesHistorico >= dataInicioAssinatura && inicioMesHistorico <= dataFimComparacao) ||
                    (fimMesHistorico >= dataInicioAssinatura && fimMesHistorico <= dataFimComparacao) ||
                    (inicioMesHistorico <= dataInicioAssinatura && fimMesHistorico >= dataFimComparacao);
                if (temIntersecao) {
                    analisesFeitasPeriodo += Number(h.analisesFeitas || 0);
                }
            }
        }
        else {
            tokensChatUsadosPeriodo = Number(historicoAtual?.tokensUtilizados || 0);
            analisesFeitasPeriodo = Number(historicoAtual?.analisesFeitas || 0);
        }
        const tokensChatLimite = plano ? Number(plano.tokenChat) : 0;
        const porcentagemUsoTokens = tokensChatLimite > 0
            ? Math.min(100, Math.round((tokensChatUsadosPeriodo / tokensChatLimite) * 100))
            : 0;
        const analisesLimite = plano ? Number(plano.limiteAnalises) : 0;
        const analisesRestantes = Math.max(0, analisesLimite - analisesFeitasPeriodo);
        const porcentagemUsoAnalises = analisesLimite > 0
            ? Math.min(100, Math.round((analisesFeitasPeriodo / analisesLimite) * 100))
            : 0;
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
    async getAnalisesInfo(clienteMasterId, userId, userTipo) {
        const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
        if (!clienteMaster) {
            throw new common_1.NotFoundException('Cliente Master não encontrado');
        }
        if (userTipo === 'master') {
            const clientesMaster = await this.clientesMasterService.findByUserId(userId);
            const temAcesso = clientesMaster.some((cm) => cm.id === clienteMasterId);
            if (!temAcesso) {
                throw new common_1.BadRequestException('Você não tem permissão para acessar este recurso');
            }
        }
        else {
            const usuariosComuns = await this.userComumService.findByUserId(userId);
            const temAcesso = usuariosComuns.some((uc) => uc.clienteMasterId === clienteMasterId);
            if (!temAcesso) {
                throw new common_1.BadRequestException('Você não tem permissão para acessar este recurso');
            }
        }
        const assinaturaEntity = await this.assinaturaRepository.findOne({
            where: { userId: clienteMaster.id },
            relations: ['plano'],
            order: { createdAt: 'DESC' },
        });
        let plano = null;
        if (assinaturaEntity && assinaturaEntity.planoId) {
            plano = await this.planosService.findById(assinaturaEntity.planoId);
        }
        const limitePlano = plano ? Number(plano.limiteAnalises) : 0;
        const agora = new Date();
        let dataInicioAssinatura = null;
        let dataFimAssinatura = null;
        if (assinaturaEntity) {
            if (assinaturaEntity.nextDueDate) {
                dataInicioAssinatura = this.parseNextDueDate(assinaturaEntity.nextDueDate);
                if (dataInicioAssinatura) {
                    dataFimAssinatura = new Date(dataInicioAssinatura);
                    dataFimAssinatura.setMonth(dataFimAssinatura.getMonth() + 1);
                }
            }
            else if (assinaturaEntity.createdAt) {
                dataInicioAssinatura = new Date(assinaturaEntity.createdAt);
                const diaFaturamento = dataInicioAssinatura.getDate();
                const mesesDesdeInicio = Math.floor((agora.getTime() - dataInicioAssinatura.getTime()) / (1000 * 60 * 60 * 24 * 30));
                const proxima = new Date(dataInicioAssinatura);
                proxima.setMonth(proxima.getMonth() + mesesDesdeInicio + 1);
                proxima.setDate(diaFaturamento);
                if (proxima <= agora) {
                    proxima.setMonth(proxima.getMonth() + 1);
                }
                dataFimAssinatura = proxima;
            }
        }
        const todosHistoricos = await this.historicoRepository.find({
            where: { clienteMasterId: clienteMaster.id },
        });
        let analisesFeitasPeriodo = 0;
        if (dataInicioAssinatura) {
            const dataFimComparacao = dataFimAssinatura || agora;
            for (const h of todosHistoricos) {
                const inicioMesHistorico = new Date(h.ano, h.mes - 1, 1);
                const fimMesHistorico = new Date(h.ano, h.mes, 0, 23, 59, 59, 999);
                const temIntersecao = (inicioMesHistorico >= dataInicioAssinatura && inicioMesHistorico <= dataFimComparacao) ||
                    (fimMesHistorico >= dataInicioAssinatura && fimMesHistorico <= dataFimComparacao) ||
                    (inicioMesHistorico <= dataInicioAssinatura && fimMesHistorico >= dataFimComparacao);
                if (temIntersecao) {
                    analisesFeitasPeriodo += Number(h.analisesFeitas || 0);
                }
            }
        }
        else {
            analisesFeitasPeriodo = todosHistoricos.reduce((sum, h) => sum + Number(h.analisesFeitas || 0), 0);
        }
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
    getDataAtualBrasil() {
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
    calcularProximos7Dias() {
        const agora = new Date();
        const formatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const proximos7Dias = new Date(agora);
        proximos7Dias.setDate(proximos7Dias.getDate() + 7);
        const partes = formatter.formatToParts(proximos7Dias);
        const ano = partes.find(p => p.type === 'year')?.value || '0000';
        const mes = partes.find(p => p.type === 'month')?.value.padStart(2, '0') || '00';
        const dia = partes.find(p => p.type === 'day')?.value.padStart(2, '0') || '00';
        return `${ano}-${mes}-${dia}`;
    }
    calcularProximoMes() {
        const agora = new Date();
        const formatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const proximoMes = new Date(agora);
        proximoMes.setMonth(proximoMes.getMonth() + 1);
        const partes = formatter.formatToParts(proximoMes);
        const ano = partes.find(p => p.type === 'year')?.value || '0000';
        const mes = partes.find(p => p.type === 'month')?.value.padStart(2, '0') || '00';
        const dia = partes.find(p => p.type === 'day')?.value.padStart(2, '0') || '00';
        return `${ano}-${mes}-${dia}`;
    }
    parseDataBrasil(dataString) {
        const [year, month, day] = dataString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
        return date;
    }
    async adicionarRecorrencia(assinatura) {
        try {
            const recorrenciaExistente = await this.recorrenciaRepository.findOne({
                where: { assinaturaId: assinatura.id },
            });
            if (recorrenciaExistente) {
                recorrenciaExistente.nextDueDate = assinatura.nextDueDate || this.parseDataBrasil(this.calcularProximoMes());
                recorrenciaExistente.valor = assinatura.value;
                await this.recorrenciaRepository.save(recorrenciaExistente);
            }
            else {
                const recorrencia = this.recorrenciaRepository.create({
                    assinaturaId: assinatura.id,
                    userId: assinatura.userId,
                    nextDueDate: assinatura.nextDueDate || this.parseDataBrasil(this.calcularProximoMes()),
                    valor: assinatura.value,
                });
                await this.recorrenciaRepository.save(recorrencia);
            }
        }
        catch (error) {
            console.error('Erro ao adicionar recorrência:', error.message);
        }
    }
    async removerRecorrencia(assinaturaId) {
        try {
            await this.recorrenciaRepository.delete({ assinaturaId });
        }
        catch (error) {
            console.error('Erro ao remover recorrência:', error.message);
        }
    }
    async registrarCobranca(data) {
        try {
            const cobrancaExistente = await this.cobrancaRepository.findOne({
                where: { asaasPaymentId: data.asaasPaymentId },
            });
            if (cobrancaExistente) {
                cobrancaExistente.status = data.status;
                if (data.paymentDate) {
                    cobrancaExistente.paymentDate = data.paymentDate;
                }
                if (data.userId && !cobrancaExistente.userId) {
                    cobrancaExistente.userId = data.userId;
                }
                if (data.assinaturaId) {
                    cobrancaExistente.assinaturaId = data.assinaturaId;
                }
                cobrancaExistente.asaasResponse = data.asaasResponse;
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
            }
            else {
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
        }
        catch (error) {
            console.error('Erro ao registrar cobrança:', error.message);
            throw error;
        }
    }
    async gerenciarRecorrencia(assinatura) {
        if (assinatura.status === 'ACTIVE') {
            await this.adicionarRecorrencia(assinatura);
        }
        else if (assinatura.status === 'CANCELED' || assinatura.status === 'INACTIVE') {
            await this.removerRecorrencia(assinatura.id);
        }
    }
    parseNextDueDate(nextDueDate) {
        if (!nextDueDate) {
            return null;
        }
        if (nextDueDate instanceof Date) {
            return isNaN(nextDueDate.getTime()) ? null : nextDueDate;
        }
        if (typeof nextDueDate === 'string') {
            const [year, month, day] = nextDueDate.split('-').map(Number);
            if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
                console.warn(`⚠️ Data inválida recebida: ${nextDueDate}`);
                return null;
            }
            const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
            if (isNaN(date.getTime())) {
                console.warn(`⚠️ Data inválida recebida: ${nextDueDate}`);
                return null;
            }
            return date;
        }
        return null;
    }
    async createPayment(createPaymentDto) {
        if (createPaymentDto.creditCard && createPaymentDto.creditCardToken) {
            throw new common_1.BadRequestException('Não é possível enviar creditCard e creditCardToken ao mesmo tempo. Use apenas um deles.');
        }
        if (!createPaymentDto.creditCard && !createPaymentDto.creditCardToken) {
            throw new common_1.BadRequestException('É necessário enviar creditCard ou creditCardToken.');
        }
        if (createPaymentDto.creditCard) {
            if (!createPaymentDto.creditCard.holderName ||
                !createPaymentDto.creditCard.number ||
                !createPaymentDto.creditCard.expiryMonth ||
                !createPaymentDto.creditCard.expiryYear ||
                !createPaymentDto.creditCard.ccv) {
                throw new common_1.BadRequestException('Todos os campos do cartão são obrigatórios quando usar creditCard.');
            }
            const holderInfo = createPaymentDto.creditCardHolderInfo;
            if (!holderInfo) {
                throw new common_1.BadRequestException('creditCardHolderInfo é obrigatório quando usar creditCard.');
            }
            if (!holderInfo.name ||
                !holderInfo.email ||
                !holderInfo.postalCode ||
                !holderInfo.addressNumber ||
                !holderInfo.cpfCnpj ||
                !holderInfo.phone) {
                throw new common_1.BadRequestException('Todos os campos de creditCardHolderInfo são obrigatórios.');
            }
        }
        const paymentData = {
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
            const holderInfo = createPaymentDto.creditCardHolderInfo;
            paymentData.creditCardHolderInfo = {
                name: holderInfo.name,
                email: holderInfo.email,
                postalCode: holderInfo.postalCode,
                addressNumber: holderInfo.addressNumber,
                cpfCnpj: holderInfo.cpfCnpj,
                phone: holderInfo.phone,
            };
        }
        else if (createPaymentDto.creditCardToken) {
            paymentData.creditCardToken = createPaymentDto.creditCardToken;
        }
        if (createPaymentDto.remoteIp) {
            paymentData.remoteIp = createPaymentDto.remoteIp;
        }
        try {
            const result = await this.asaasService.createPayment(paymentData);
            (0, newrelic_logger_1.newRelicLog)('info', 'Pagamento avulso criado', {
                asaasPaymentId: result.id,
                status: result.status,
                valor: createPaymentDto.value,
                customerId: createPaymentDto.customer,
                billingType: createPaymentDto.billingType,
                aprovado: result.status === 'CONFIRMED' || result.status === 'RECEIVED',
            });
            return result;
        }
        catch (error) {
            (0, newrelic_logger_1.newRelicLog)('error', 'Erro ao criar pagamento avulso', {
                error: error.message,
                customerId: createPaymentDto.customer,
                valor: createPaymentDto.value,
                billingType: createPaymentDto.billingType,
            });
            throw error;
        }
    }
    async handleCronProcessarRecorrencias() {
        const dataExecucao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        console.log(`\n${'#'.repeat(80)}`);
        console.log(`⏰ [${dataExecucao}] Executando CRON agendado às 9h da manhã`);
        console.log(`${'#'.repeat(80)}\n`);
        (0, newrelic_logger_1.newRelicLog)('info', 'CRON: Iniciando processamento de recorrências', {
            cronName: 'processar-recorrencias',
            dataExecucao,
            timeZone: 'America/Sao_Paulo',
        });
        try {
            const resultado = await this.processarRecorrencias();
            (0, newrelic_logger_1.newRelicLog)('info', 'CRON: Processamento de recorrências concluído', {
                cronName: 'processar-recorrencias',
                processadas: resultado.processadas,
                sucesso: resultado.sucesso,
                falhas: resultado.falhas,
            });
        }
        catch (error) {
            console.error(`❌ Erro no CRON automático:`, error.message);
            console.error(`   Stack:`, error.stack);
            (0, newrelic_logger_1.newRelicLog)('error', 'CRON: Erro no processamento de recorrências', {
                cronName: 'processar-recorrencias',
                error: error.message,
                stack: error.stack,
            });
        }
    }
    async processarRecorrencias() {
        const timestamp = new Date().toISOString();
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🔄 [${timestamp}] CRON: Iniciando processamento de recorrências`);
        console.log(`${'='.repeat(80)}`);
        const hoje = this.getDataAtualBrasil();
        const hojeDate = this.parseDataBrasil(hoje);
        console.log(`📅 Data de hoje (Brasil): ${hoje}`);
        console.log(`📅 Data de hoje (Date object): ${hojeDate}`);
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
        }
        else {
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
            console.log(`   Customer ID (ASAAS): ${assinatura.asaasCustomerId || 'NÃO ENCONTRADO'}`);
            console.log(`   Token do cartão: ${assinatura.creditCardToken ? 'PRESENTE' : 'NÃO ENCONTRADO'}`);
            if (assinatura.status !== 'ACTIVE') {
                console.log(`⚠️ [${i + 1}/${recorrencias.length}] Assinatura ${assinatura.id} não está ativa (status: ${assinatura.status}). Removendo da recorrência.`);
                await this.removerRecorrencia(assinatura.id);
                jobsPulados++;
                continue;
            }
            if (!assinatura.creditCardToken || !assinatura.asaasCustomerId) {
                console.error(`❌ [${i + 1}/${recorrencias.length}] Assinatura ${assinatura.id} não tem token do cartão ou customer ID`);
                console.error(`   creditCardToken: ${assinatura.creditCardToken ? 'OK' : 'FALTANDO'}`);
                console.error(`   asaasCustomerId: ${assinatura.asaasCustomerId ? 'OK' : 'FALTANDO'}`);
                jobsPulados++;
                continue;
            }
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
                console.log(`   ASAAS Payment ID: ${cobrancaExistente.asaasPaymentId}`);
                console.log(`   ⏭️ Pulando esta recorrência para evitar cobrança duplicada`);
                (0, newrelic_logger_1.newRelicLog)('warn', 'Recorrência pulada - cobrança já existe', {
                    assinaturaId: assinatura.id,
                    recorrenciaId: recorrencia.id,
                    cobrancaExistenteId: cobrancaExistente.id,
                    cobrancaStatus: cobrancaExistente.status,
                    data: hoje,
                    motivo: 'Cobrança duplicada evitada',
                });
                jobsPulados++;
                continue;
            }
            console.log(`✅ [${i + 1}/${recorrencias.length}] Nenhuma cobrança encontrada para esta data. Adicionando job à fila...`);
            try {
                await this.queueService.adicionarJobProcessarRecorrencia(recorrencia.id, assinatura.id);
                jobsAdicionados++;
                console.log(`📋 Job adicionado à fila para recorrência ${recorrencia.id} - Assinatura: ${assinatura.id}`);
            }
            catch (error) {
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
            sucesso: 0,
            falhas: 0,
            detalhes: [],
        };
    }
    async processarRecorrenciaIndividual(recorrenciaId, assinaturaId) {
        console.log(`\n${'-'.repeat(80)}`);
        console.log(`🔄 Processando recorrência individual ID: ${recorrenciaId}`);
        console.log(`   Assinatura ID: ${assinaturaId}`);
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
        if (assinatura.status !== 'ACTIVE') {
            console.log(`⚠️ Assinatura ${assinatura.id} não está ativa (status: ${assinatura.status}). Removendo da recorrência.`);
            await this.removerRecorrencia(assinatura.id);
            throw new Error(`Assinatura não está ativa (status: ${assinatura.status})`);
        }
        if (!assinatura.creditCardToken || !assinatura.asaasCustomerId) {
            throw new Error('Dados insuficientes para cobrança (falta token ou customer ID)');
        }
        const hoje = this.getDataAtualBrasil();
        const hojeDate = this.parseDataBrasil(hoje);
        console.log(`🔍 Verificando se já existe cobrança para esta assinatura na data de hoje...`);
        const cobrancaExistente = await this.cobrancaRepository
            .createQueryBuilder('cobranca')
            .where('cobranca.assinatura_id = :assinaturaId', { assinaturaId: assinatura.id })
            .andWhere('cobranca.due_date = :hoje', { hoje: hojeDate })
            .getOne();
        if (cobrancaExistente) {
            console.log(`⚠️ JÁ EXISTE cobrança para assinatura ${assinatura.id} na data ${hoje}`);
            console.log(`   Cobrança ID: ${cobrancaExistente.id}`);
            console.log(`   Status: ${cobrancaExistente.status}`);
            console.log(`   ASAAS Payment ID: ${cobrancaExistente.asaasPaymentId}`);
            console.log(`   ⏭️ Pulando esta recorrência para evitar cobrança duplicada`);
            (0, newrelic_logger_1.newRelicLog)('warn', 'Recorrência pulada - cobrança já existe', {
                assinaturaId: assinatura.id,
                recorrenciaId: recorrencia.id,
                cobrancaExistenteId: cobrancaExistente.id,
                cobrancaStatus: cobrancaExistente.status,
                data: hoje,
                motivo: 'Cobrança duplicada evitada',
            });
            throw new Error(`Cobrança já existe para esta data. Status: ${cobrancaExistente.status}`);
        }
        console.log(`✅ Nenhuma cobrança encontrada para esta data. Prosseguindo...`);
        try {
            console.log(`💳 Criando cobrança na ASAAS...`);
            console.log(`   Valor: R$ ${Number(recorrencia.valor)}`);
            console.log(`   Due Date: ${hoje}`);
            console.log(`   Customer: ${assinatura.asaasCustomerId}`);
            console.log(`   Billing Type: ${assinatura.billingType || 'CREDIT_CARD'}`);
            const paymentResult = await this.asaasService.createPayment({
                billingType: assinatura.billingType || 'CREDIT_CARD',
                customer: assinatura.asaasCustomerId,
                value: Number(recorrencia.valor),
                dueDate: hoje,
                creditCardToken: assinatura.creditCardToken,
            });
            console.log(`✅ Cobrança criada na ASAAS`);
            console.log(`   Payment ID: ${paymentResult.id}`);
            console.log(`   Status: ${paymentResult.status}`);
            console.log(`💾 Registrando cobrança na tabela...`);
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
                assinaturaId: null,
                planoId: assinatura.planoId || null,
                couponId: assinatura.couponId || null,
            });
            console.log(`✅ Cobrança registrada na tabela`);
            if (paymentResult.status === 'CONFIRMED' || paymentResult.status === 'RECEIVED') {
                console.log(`✅ Pagamento CONFIRMED! Atualizando assinatura e recorrência...`);
                const proximoMes = this.calcularProximoMes();
                const proximoMesDate = this.parseDataBrasil(proximoMes);
                console.log(`   Próxima data de cobrança: ${proximoMes}`);
                console.log(`   Atualizando assinatura ${assinatura.id}...`);
                assinatura.nextDueDate = proximoMesDate;
                await this.assinaturaRepository.save(assinatura);
                console.log(`   ✅ Assinatura atualizada`);
                console.log(`   Atualizando recorrência ${recorrencia.id}...`);
                recorrencia.nextDueDate = proximoMesDate;
                recorrencia.valor = assinatura.value;
                await this.recorrenciaRepository.save(recorrencia);
                console.log(`   ✅ Recorrência atualizada`);
                console.log(`   Vinculando cobrança à assinatura...`);
                const cobranca = await this.cobrancaRepository.findOne({
                    where: { asaasPaymentId: paymentResult.id },
                });
                if (cobranca) {
                    cobranca.assinaturaId = assinatura.id;
                    await this.cobrancaRepository.save(cobranca);
                    console.log(`   ✅ Cobrança vinculada`);
                    (0, newrelic_logger_1.newRelicLog)('info', 'Recorrência processada com sucesso', {
                        assinaturaId: assinatura.id,
                        recorrenciaId: recorrencia.id,
                        asaasPaymentId: paymentResult.id,
                        valor: Number(recorrencia.valor),
                        proximaCobranca: proximoMes,
                        status: 'CONFIRMED',
                    });
                }
                else {
                    console.log(`   ⚠️ Cobrança não encontrada para vincular`);
                }
                console.log(`✅ SUCESSO: Cobrança confirmada para assinatura ${assinatura.id}. Próxima cobrança: ${proximoMes}`);
            }
            else {
                console.log(`❌ Pagamento NÃO confirmado. Status: ${paymentResult.status}`);
                console.log(`   Colocando assinatura como PENDING e removendo da recorrência...`);
                assinatura.status = 'PENDING';
                await this.assinaturaRepository.save(assinatura);
                console.log(`   ✅ Assinatura marcada como PENDING`);
                await this.removerRecorrencia(assinatura.id);
                console.log(`   ✅ Assinatura removida da recorrência`);
                const cobranca = await this.cobrancaRepository.findOne({
                    where: { asaasPaymentId: paymentResult.id },
                });
                if (cobranca) {
                    cobranca.status = 'FAILED';
                    await this.cobrancaRepository.save(cobranca);
                    console.log(`   ✅ Cobrança marcada como FAILED`);
                }
                console.error(`❌ FALHA: Cobrança falhou para assinatura ${assinatura.id}. Status: ${paymentResult.status}`);
                (0, newrelic_logger_1.newRelicLog)('warn', 'Recorrência falhou - pagamento não confirmado', {
                    assinaturaId: assinatura.id,
                    recorrenciaId: recorrencia.id,
                    asaasPaymentId: paymentResult.id,
                    valor: Number(recorrencia.valor),
                    status: paymentResult.status,
                });
                throw new Error(`Pagamento não confirmado. Status: ${paymentResult.status}`);
            }
        }
        catch (error) {
            console.error(`\n❌ ERRO ao processar cobrança para assinatura ${assinatura.id}:`);
            console.error(`   Mensagem: ${error.message}`);
            console.error(`   Stack: ${error.stack}`);
            console.log(`   Colocando assinatura como PENDING e removendo da recorrência...`);
            assinatura.status = 'PENDING';
            await this.assinaturaRepository.save(assinatura);
            console.log(`   ✅ Assinatura marcada como PENDING`);
            await this.removerRecorrencia(assinatura.id);
            console.log(`   ✅ Assinatura removida da recorrência`);
            (0, newrelic_logger_1.newRelicLog)('error', 'Erro ao processar recorrência', {
                assinaturaId: assinatura.id,
                recorrenciaId: recorrencia.id,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    async createCustomer(createCustomerDto) {
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
                        throw new common_1.BadRequestException('Já existe uma assinatura ativa ou pendente para este email e telefone. Não é possível cadastrar novamente.');
                    }
                }
                return await this.handleExistingCustomerWithoutSubscription(userBase, createCustomerDto, telefoneNormalizado);
            }
            if (existingUserBaseByEmail && !mesmoUsuario) {
                const clientesMasterEmail = await this.clientesMasterService.findByUserId(existingUserBaseByEmail.id);
                const hasSubscription = clientesMasterEmail.length > 0
                    ? await this.hasActiveSubscription(clientesMasterEmail[0].id)
                    : false;
                if (hasSubscription) {
                    throw new common_1.ConflictException('Já existe um usuário cadastrado com este e-mail e possui assinatura ativa');
                }
                return await this.handleExistingCustomerWithoutSubscription(existingUserBaseByEmail, createCustomerDto, telefoneNormalizado);
            }
            if (existingUserBaseByPhone && !mesmoUsuario) {
                const clientesMasterPhone = await this.clientesMasterService.findByUserId(existingUserBaseByPhone.id);
                const hasSubscription = clientesMasterPhone.length > 0
                    ? await this.hasActiveSubscription(clientesMasterPhone[0].id)
                    : false;
                if (hasSubscription) {
                    throw new common_1.ConflictException('Já existe um usuário cadastrado com este telefone e possui assinatura ativa');
                }
                return await this.handleExistingCustomerWithoutSubscription(existingUserBaseByPhone, createCustomerDto, telefoneNormalizado);
            }
            const existingClienteMaster = await this.clientesMasterService.findByEmail(createCustomerDto.email);
            let clienteMaster;
            let userBase;
            let asaasCustomerId;
            if (existingClienteMaster) {
                clienteMaster = existingClienteMaster;
                userBase = await this.userBaseService.findById(existingClienteMaster.userId);
                if (!userBase) {
                    throw new common_1.InternalServerErrorException('UserBase não encontrado para o ClienteMaster existente');
                }
                if (userBase.asaasCustomerId) {
                    return {
                        asaasCustomerId: userBase.asaasCustomerId,
                        userId: userBase.id,
                    };
                }
                asaasCustomerId = await this.asaasService.createCustomer(this.prepareAsaasCustomerData(createCustomerDto));
                await this.userBaseService.update(userBase.id, { asaasCustomerId });
                return {
                    asaasCustomerId,
                    userId: userBase.id,
                };
            }
            else {
                const hashedPassword = await bcrypt.hash(createCustomerDto.password, 10);
                const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
                const tokenExpiresAt = new Date();
                tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
                asaasCustomerId = await this.asaasService.createCustomer(this.prepareAsaasCustomerData(createCustomerDto));
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
        }
        catch (error) {
            if (error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException || error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Erro ao criar customer: ${error.message || 'Erro desconhecido'}`);
        }
    }
    async hasActiveSubscription(clienteMasterId) {
        const assinatura = await this.assinaturaRepository.findOne({
            where: [
                { userId: clienteMasterId, status: 'ACTIVE' },
                { userId: clienteMasterId, status: 'PENDING' },
            ],
        });
        return !!assinatura;
    }
    prepareAsaasCustomerData(createCustomerDto) {
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
    async ensureAsaasCustomer(userBase, createCustomerDto) {
        const customerData = this.prepareAsaasCustomerData(createCustomerDto);
        if (userBase.asaasCustomerId) {
            try {
                await this.asaasService.updateCustomer(userBase.asaasCustomerId, customerData);
                return userBase.asaasCustomerId;
            }
            catch (error) {
                console.error('Erro ao atualizar customer na Asaas:', error);
                return userBase.asaasCustomerId;
            }
        }
        else {
            const asaasCustomerId = await this.asaasService.createCustomer(customerData);
            await this.userBaseService.update(userBase.id, { asaasCustomerId });
            return asaasCustomerId;
        }
    }
    async updateExistingUserBase(userBase, createCustomerDto, telefoneNormalizado, asaasCustomerId) {
        const updateData = {
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
    async handleExistingCustomerWithoutSubscription(userBase, createCustomerDto, telefoneNormalizado) {
        const asaasCustomerId = await this.ensureAsaasCustomer(userBase, createCustomerDto);
        await this.updateExistingUserBase(userBase, createCustomerDto, telefoneNormalizado, asaasCustomerId);
        return {
            asaasCustomerId,
            userId: userBase.id,
        };
    }
    async checkoutComplete(checkoutDto) {
        const userBase = await this.userBaseService.findById(checkoutDto.userId);
        if (!userBase) {
            throw new common_1.NotFoundException('Usuário não encontrado');
        }
        let clientesMaster = await this.clientesMasterService.findByUserId(userBase.id);
        let clienteMaster = clientesMaster && clientesMaster.length > 0 ? clientesMaster[0] : null;
        if (clienteMaster) {
            const existingActiveSubscription = await this.assinaturaRepository.findOne({
                where: {
                    userId: clienteMaster.id,
                    status: 'ACTIVE',
                },
            });
            if (existingActiveSubscription) {
                throw new common_1.BadRequestException('Assinatura ativa. Fale com o Suporte.');
            }
        }
        let asaasCustomerId;
        const PLANOS_TESTE = [
            '677c76e6-0ab0-4626-87bd-23f13ad2cd76',
            'ca772fbf-d9c7-4ef7-9f6c-84e535c393f0',
        ];
        const isPlanoTeste = PLANOS_TESTE.includes(checkoutDto.planoId);
        if (userBase.asaasCustomerId) {
            asaasCustomerId = userBase.asaasCustomerId;
        }
        else if (isPlanoTeste) {
            asaasCustomerId = `cus_fake_test_${userBase.id}`;
        }
        else {
            throw new common_1.BadRequestException(`Usuário não possui Id de pagamentos no gateway.`);
        }
        const plano = await this.planosService.findById(checkoutDto.planoId);
        if (!plano) {
            throw new common_1.NotFoundException('Plano não encontrado');
        }
        const valorBasePlano = plano.valorPromocional ?? plano.valorOriginal ?? null;
        if (!valorBasePlano || valorBasePlano === null || Number(valorBasePlano) <= 0) {
            throw new common_1.BadRequestException(`O plano "${plano.nome}" não possui valor configurado. Configure valorOriginal ou valorPromocional no plano antes de criar assinaturas.`);
        }
        let valorFinal = Number(valorBasePlano);
        let coupon = null;
        let couponId = null;
        if (checkoutDto.couponName) {
            coupon = await this.cuponsService.findByName(checkoutDto.couponName);
            if (coupon && coupon.active) {
                const desconto = (valorFinal * Number(coupon.discountValue)) / 100;
                valorFinal = valorFinal - desconto;
                if (valorFinal < 0)
                    valorFinal = 0;
                couponId = coupon.id;
            }
        }
        if (!valorFinal || valorFinal <= 0) {
            throw new common_1.BadRequestException('O valor da assinatura deve ser maior que zero. Verifique o valor do plano.');
        }
        let creditCardToken = null;
        let creditCardNumber = null;
        let creditCardBrand = null;
        if (checkoutDto.billingType === 'CREDIT_CARD') {
            if (checkoutDto.creditCardToken) {
                creditCardToken = checkoutDto.creditCardToken;
                creditCardNumber = checkoutDto.creditCardNumber || null;
                creditCardBrand = checkoutDto.creditCardBrand || null;
            }
            else {
                if (!checkoutDto.creditCardHolderName ||
                    !checkoutDto.creditCardNumber ||
                    !checkoutDto.creditCardExpiryMonth ||
                    !checkoutDto.creditCardExpiryYear ||
                    !checkoutDto.creditCardCcv) {
                    throw new common_1.BadRequestException('Dados do cartão de crédito são obrigatórios ou forneça creditCardToken');
                }
            }
        }
        let paymentResult = null;
        if (isPlanoTeste && checkoutDto.billingType === 'CREDIT_CARD') {
            console.log('🧪 Modo TESTE: Criando pagamento e assinatura fake para plano de teste');
            const dueDateString = this.getDataAtualBrasil();
            const paymentDateString = this.getDataAtualBrasil();
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
            await this.registrarCobranca({
                userId: null,
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
        }
        else if (checkoutDto.billingType === 'CREDIT_CARD') {
            if (!creditCardToken) {
                throw new common_1.BadRequestException('Token do cartão é obrigatório para processar a primeira cobrança após o período grátis');
            }
            console.log('✅ Token do cartão validado. Período grátis de 7 dias ativado. Primeira cobrança será processada automaticamente após 7 dias.');
        }
        if (!clienteMaster) {
            clienteMaster = await this.clientesMasterService.create({
                userId: userBase.id,
            });
            if (isPlanoTeste) {
                console.log('✅ ClienteMaster criado para plano de teste:', clienteMaster.id);
            }
            else {
                console.log('✅ ClienteMaster criado. Período grátis de 7 dias ativado:', clienteMaster.id);
            }
        }
        const nextDueDateString = isPlanoTeste
            ? this.calcularProximoMes()
            : this.calcularProximos7Dias();
        const nextDueDate = this.parseDataBrasil(nextDueDateString);
        const assinaturaData = {
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
            }
            else {
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
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Erro ao salvar assinatura no banco de dados: ${error.message || 'Erro desconhecido'}`);
        }
    }
    toResponseDto(subscription) {
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
};
exports.AssinaturasService = AssinaturasService;
__decorate([
    (0, schedule_1.Cron)('0 9 * * *', {
        name: 'processar-recorrencias',
        timeZone: 'America/Sao_Paulo',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssinaturasService.prototype, "handleCronProcessarRecorrencias", null);
exports.AssinaturasService = AssinaturasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assinatura_entity_1.Assinatura)),
    __param(1, (0, typeorm_1.InjectRepository)(recorrencia_entity_1.Recorrencia)),
    __param(2, (0, typeorm_1.InjectRepository)(cobranca_entity_1.Cobranca)),
    __param(3, (0, typeorm_1.InjectRepository)(cupom_entity_1.Cupom)),
    __param(4, (0, typeorm_1.InjectRepository)(historico_mensal_entity_1.HistoricoMensal)),
    __param(8, (0, common_1.Inject)((0, common_1.forwardRef)(() => clientes_master_service_1.ClientesMasterService))),
    __param(12, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        asaas_service_1.AsaasService,
        planos_service_1.PlanosService,
        cupons_service_1.CuponsService,
        clientes_master_service_1.ClientesMasterService,
        users_service_1.UsersService,
        user_base_service_1.UserBaseService,
        user_comum_service_1.UserComumService,
        chat_service_1.ChatService,
        queue_service_1.QueueService])
], AssinaturasService);
//# sourceMappingURL=assinaturas.service.js.map