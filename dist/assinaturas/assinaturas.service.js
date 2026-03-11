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
const pagar_me_service_1 = require("./services/pagar-me.service");
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
    pagarMeService;
    planosService;
    cuponsService;
    clientesMasterService;
    usersService;
    userBaseService;
    userComumService;
    chatService;
    queueService;
    constructor(assinaturaRepository, recorrenciaRepository, cobrancaRepository, cupomRepository, historicoRepository, pagarMeService, planosService, cuponsService, clientesMasterService, usersService, userBaseService, userComumService, chatService, queueService) {
        this.assinaturaRepository = assinaturaRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.cobrancaRepository = cobrancaRepository;
        this.cupomRepository = cupomRepository;
        this.historicoRepository = historicoRepository;
        this.pagarMeService = pagarMeService;
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
            }
        }
        catch (error) {
            if (error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Erro ao criar/obter cliente: ${error.message || 'Erro desconhecido'}`);
        }
        let pagarMeCustomerId;
        try {
            const customerRes = await this.pagarMeService.createCustomer(this.preparePagarMeCustomerData(createSubscriptionDto.name, createSubscriptionDto.email, createSubscriptionDto.cpf, createSubscriptionDto.phone, createSubscriptionDto.postalCode, createSubscriptionDto.address, createSubscriptionDto.addressNumber, createSubscriptionDto.complement, createSubscriptionDto.province, createSubscriptionDto.city, createSubscriptionDto.state, undefined));
            pagarMeCustomerId = customerRes.id;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Erro ao criar cliente no Pagar.me: ${error.message || 'Erro desconhecido'}`);
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
        let cardId = null;
        if (createSubscriptionDto.billingType === 'CREDIT_CARD' && creditCardToken) {
            try {
                const billingAddress = {
                    country: 'BR',
                    state: createSubscriptionDto.state || '',
                    city: createSubscriptionDto.city || '',
                    zip_code: (createSubscriptionDto.postalCode || '').replace(/\D/g, ''),
                    line_1: [createSubscriptionDto.address, createSubscriptionDto.addressNumber]
                        .filter(Boolean)
                        .join(', '),
                    line_2: createSubscriptionDto.complement || '',
                };
                const cardIdRes = await this.pagarMeService.addCard(pagarMeCustomerId, creditCardToken, billingAddress);
                cardId = cardIdRes.id;
            }
            catch (error) {
                (0, newrelic_logger_1.newRelicLog)('error', 'Erro ao vincular cartão na criação de assinatura', { error: error.message, customerId: pagarMeCustomerId });
                throw new common_1.BadRequestException(`Erro ao vincular cartão: ${error.message || 'Erro desconhecido'}`);
            }
        }
        if (createSubscriptionDto.billingType === 'CREDIT_CARD' && !cardId) {
            throw new common_1.BadRequestException('Não foi possível vincular o cartão ao cliente.');
        }
        console.log('✅ cardId:', cardId);
        if (!clienteMaster) {
            clienteMaster = await this.clientesMasterService.create({
                userId: userBase.id,
            });
            if (!clienteMaster) {
                throw new common_1.InternalServerErrorException('Erro ao criar ClienteMaster');
            }
        }
        const nextDueDateString = this.calcularProximos7Dias();
        const nextDueDate = this.parseDataBrasil(nextDueDateString);
        const assinaturaData = {
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
            (0, newrelic_logger_1.newRelicLog)('info', 'Assinatura criada com sucesso (recorrência em 5 dias)', {
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
        let pagarMeCustomerId = null;
        let pagarMeCardId = null;
        if (createSimpleSubscriptionDto.billingType === 'CREDIT_CARD') {
            if (!createSimpleSubscriptionDto.creditCardToken) {
                throw new common_1.BadRequestException('Token do cartão de crédito é obrigatório. A tokenização deve ser feita no frontend.');
            }
            creditCardToken = createSimpleSubscriptionDto.creditCardToken;
            creditCardNumber = createSimpleSubscriptionDto.creditCardNumber || null;
            creditCardBrand = createSimpleSubscriptionDto.creditCardBrand || null;
            if (!userBase.pagarMeCustomerId) {
                const customerRes = await this.pagarMeService.createCustomer(this.preparePagarMeCustomerData(userBase.nome || '', userBase.email, userBase.cpf || '', userBase.telefone || '', userBase.postalCode || '', userBase.address || '', userBase.addressNumber || '', userBase.complement, userBase.province, userBase.city, userBase.state, userBase.id, undefined));
                pagarMeCustomerId = customerRes.id;
                await this.userBaseService.update(userBase.id, { pagarMeCustomerId });
            }
            else {
                pagarMeCustomerId = userBase.pagarMeCustomerId;
            }
            const billingAddress = {
                country: 'BR',
                state: userBase.state || '',
                city: userBase.city || '',
                zip_code: (userBase.postalCode || '').replace(/\D/g, ''),
                line_1: [userBase.address, userBase.addressNumber].filter(Boolean).join(', '),
                line_2: userBase.complement || '',
            };
            const cardRes = await this.pagarMeService.addCard(pagarMeCustomerId, creditCardToken, billingAddress);
            pagarMeCardId = cardRes.id;
        }
        const nextDueDateString = this.calcularProximos7Dias();
        const nextDueDate = this.parseDataBrasil(nextDueDateString);
        const assinaturaData = {
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
    async atualizarCobrancaComStatusPagarMe(orderId) {
        let orderData = null;
        try {
            orderData = await this.pagarMeService.getOrder(orderId);
        }
        catch (error) {
            console.error('Erro ao buscar pedido no Pagar.me:', error);
            throw new common_1.NotFoundException('Pedido não encontrado no Pagar.me');
        }
        const cobranca = await this.cobrancaRepository.findOne({
            where: { pagarMeOrderId: orderId },
        });
        if (!cobranca) {
            throw new common_1.NotFoundException('Cobrança não encontrada para este pedido');
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
    async checkPaymentStatus(paymentId) {
        try {
            const cobranca = await this.atualizarCobrancaComStatusPagarMe(paymentId);
            const status = cobranca.status;
            if (status === 'paid' && !cobranca.assinaturaId) {
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
        const tokensFromConversations = await this.chatService.getTotalTokensForDashboard(clienteMaster.id, clienteMaster.userId);
        const tokensFromMessages = await this.chatService.getTotalTokensFromMessagesForDashboard(clienteMaster.id, clienteMaster.userId);
        const tokensChatUsados = Math.max(tokensFromConversations, tokensFromMessages);
        let tokensChatUsadosPeriodo = 0;
        let analisesFeitasPeriodo = 0;
        if (dataInicioAssinatura) {
            const periodoFromConversations = await this.chatService.getTotalTokensForDashboardInPeriod(clienteMaster.id, clienteMaster.userId, dataInicioAssinatura, dataFimAssinatura || agora);
            const periodoFromMessages = await this.chatService.getTotalTokensFromMessagesForDashboardInPeriod(clienteMaster.id, clienteMaster.userId, dataInicioAssinatura, dataFimAssinatura || agora);
            tokensChatUsadosPeriodo = Math.max(periodoFromConversations, periodoFromMessages);
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
    calcularProximos2Dias() {
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
    calcularProximos7Dias() {
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
                where: { pagarMeOrderId: data.pagarMeOrderId },
            });
            if (cobrancaExistente) {
                cobrancaExistente.status = data.status;
                if (data.paymentDate)
                    cobrancaExistente.paymentDate = data.paymentDate;
                if (data.userId && !cobrancaExistente.userId)
                    cobrancaExistente.userId = data.userId;
                if (data.assinaturaId)
                    cobrancaExistente.assinaturaId = data.assinaturaId;
                cobrancaExistente.pagarMeResponse = data.pagarMeResponse;
                if (data.dueDate !== undefined)
                    cobrancaExistente.dueDate = data.dueDate;
                if (data.planoId !== undefined)
                    cobrancaExistente.planoId = data.planoId;
                if (data.couponId !== undefined)
                    cobrancaExistente.couponId = data.couponId;
                if (data.dadosAssinatura !== undefined)
                    cobrancaExistente.dadosAssinatura = data.dadosAssinatura;
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
            throw new common_1.BadRequestException('Use apenas creditCard ou creditCardToken.');
        }
        const customerId = createPaymentDto.customer;
        let cardId;
        const assinaturaParaBilling = await this.assinaturaRepository.findOne({
            where: { pagarMeCustomerId: customerId },
            order: { createdAt: 'DESC' },
        });
        const billingAddress = assinaturaParaBilling
            ? await this.buildBillingAddressFromAssinatura(assinaturaParaBilling)
            : {
                country: 'BR',
                state: '',
                city: '',
                zip_code: '',
                line_1: '',
                line_2: '',
            };
        if (createPaymentDto.creditCardToken) {
            const cardRes = await this.pagarMeService.addCard(customerId, createPaymentDto.creditCardToken, billingAddress);
            cardId = cardRes.id;
            const assinatura = await this.assinaturaRepository.findOne({
                where: { pagarMeCustomerId: customerId },
                order: { createdAt: 'DESC' },
            });
            if (assinatura) {
                assinatura.pagarMeCardId = cardRes.id;
                await this.assinaturaRepository.save(assinatura);
            }
        }
        else {
            const assinatura = await this.assinaturaRepository.findOne({
                where: { pagarMeCustomerId: customerId },
                order: { createdAt: 'DESC' },
            });
            if (!assinatura?.pagarMeCardId) {
                throw new common_1.BadRequestException('Envie creditCardToken (token do cartão) ou vincule um cartão antes. O card_id fica na assinatura e é usado para cobranças avulsas.');
            }
            cardId = assinatura.pagarMeCardId;
        }
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
            (0, newrelic_logger_1.newRelicLog)('info', 'Pagamento avulso Pagar.me criado', {
                orderId: order.id,
                status: order.status,
                valor: createPaymentDto.value,
                customerId,
            });
            return order;
        }
        catch (error) {
            (0, newrelic_logger_1.newRelicLog)('error', 'Erro ao criar pagamento avulso Pagar.me', {
                error: error.message,
                customerId,
                valor: createPaymentDto.value,
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
    async processarAssinaturasPending() {
        console.log('🔄 Iniciando processamento de assinaturas PENDING...');
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
                const clienteMaster = assinatura.clienteMaster;
                if (!clienteMaster) {
                    console.log(`❌ Assinatura ${assinatura.id} não possui cliente master vinculado`);
                    falhas++;
                    continue;
                }
                const plano = await this.planosService.findById(assinatura.planoId);
                if (!plano) {
                    console.log(`❌ Plano ${assinatura.planoId} não encontrado para assinatura ${assinatura.id}`);
                    falhas++;
                    continue;
                }
                let phoneForGateway = assinatura.phone || '';
                if (!phoneForGateway && assinatura.userId) {
                    const cm = await this.clientesMasterService.findById(assinatura.userId);
                    if (cm?.userId) {
                        const ub = await this.userBaseService.findById(cm.userId);
                        if (ub?.telefone)
                            phoneForGateway = ub.telefone;
                    }
                }
                console.log(`💳 Tentando cobrar R$ ${assinatura.value}`);
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
                    const proximaData = new Date();
                    proximaData.setDate(proximaData.getDate() + 30);
                    assinatura.status = 'ACTIVE';
                    assinatura.nextDueDate = proximaData;
                    await this.assinaturaRepository.save(assinatura);
                    const novaRecorrencia = new recorrencia_entity_1.Recorrencia();
                    novaRecorrencia.assinaturaId = assinatura.id;
                    novaRecorrencia.nextDueDate = proximaData;
                    novaRecorrencia.valor = assinatura.value;
                    await this.recorrenciaRepository.save(novaRecorrencia);
                    console.log(`📅 Nova recorrência criada para ${proximaData.toISOString().split('T')[0]}`);
                    sucesso++;
                }
                else {
                    console.log(`❌ Falha na cobrança: ${orderResult.status}`);
                    if (orderResult.closed && orderResult.status === 'failed') {
                        console.log(`   Erro: Falha no pagamento`);
                    }
                    falhas++;
                }
            }
            catch (error) {
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
        (0, newrelic_logger_1.newRelicLog)('info', 'Processamento de assinaturas PENDING concluído', {
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
        (0, newrelic_logger_1.newRelicLog)('info', `Processando recorrência individual ID: ${recorrenciaId} - Assinatura: ${assinaturaId}`);
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
        if (!assinatura.pagarMeCardId || !assinatura.pagarMeCustomerId) {
            throw new Error('Dados insuficientes para cobrança (falta pagarMeCardId ou pagarMeCustomerId)');
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
            console.log(`   Pagar.me Order ID: ${cobrancaExistente.pagarMeOrderId}`);
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
            let phoneForGateway = assinatura.phone || '';
            if (!phoneForGateway && assinatura.userId) {
                const cm = await this.clientesMasterService.findById(assinatura.userId);
                if (cm?.userId) {
                    const ub = await this.userBaseService.findById(cm.userId);
                    if (ub?.telefone)
                        phoneForGateway = ub.telefone;
                }
            }
            console.log(`💳 Criando cobrança no Pagar.me...`);
            const amountCentavos = Math.round(Number(recorrencia.valor) * 100);
            const orderCode = `rec_${recorrencia.id}_${Date.now()}`;
            const billingAddress = await this.buildBillingAddressFromAssinatura(assinatura);
            (0, newrelic_logger_1.newRelicLog)('info', 'Criando order no Pagar.me', {
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
            (0, newrelic_logger_1.newRelicLog)('info', 'Order criada no Pagar.me', {
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
                    (0, newrelic_logger_1.newRelicLog)('info', 'Recorrência Pagar.me processada com sucesso', {
                        assinaturaId: assinatura.id,
                        recorrenciaId: recorrencia.id,
                        orderId: orderResult.id,
                        valor: Number(recorrencia.valor),
                        proximaCobranca: proximoMes,
                    });
                }
                (0, newrelic_logger_1.newRelicLog)('info', 'Cobrança confirmada para assinatura', {
                    assinaturaId: assinatura.id,
                    proximaCobranca: proximoMes,
                });
                console.log(`✅ SUCESSO: Cobrança confirmada para assinatura ${assinatura.id}. Próxima: ${proximoMes}`);
            }
            else {
                console.log(`❌ Pagamento não aprovado. Status: ${orderResult.status}`);
                console.log(`   Colocando assinatura como PENDING e removendo da recorrência...`);
                assinatura.status = 'PENDING';
                await this.assinaturaRepository.save(assinatura);
                console.log(`   ✅ Assinatura marcada como PENDING`);
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
                (0, newrelic_logger_1.newRelicLog)('warn', 'Recorrência falhou - pagamento não confirmado', {
                    assinaturaId: assinatura.id,
                    recorrenciaId: recorrencia.id,
                    orderId: orderResult.id,
                    valor: Number(recorrencia.valor),
                    status: orderResult.status,
                });
                throw new Error(`Pagamento não confirmado. Status: ${orderResult.status}`);
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
            let pagarMeCustomerId;
            if (existingClienteMaster) {
                clienteMaster = existingClienteMaster;
                userBase = await this.userBaseService.findById(existingClienteMaster.userId);
                if (!userBase) {
                    throw new common_1.InternalServerErrorException('UserBase não encontrado para o ClienteMaster existente');
                }
                if (userBase.pagarMeCustomerId) {
                    return {
                        pagarMeCustomerId: userBase.pagarMeCustomerId,
                        userId: userBase.id,
                    };
                }
                const customerRes = await this.pagarMeService.createCustomer(this.preparePagarMeCustomerData(createCustomerDto.name, createCustomerDto.email, createCustomerDto.cpf, createCustomerDto.phone, createCustomerDto.postalCode, createCustomerDto.address, createCustomerDto.addressNumber, createCustomerDto.complement, createCustomerDto.province, createCustomerDto.city, createCustomerDto.state, userBase.id, createCustomerDto.birthdate));
                pagarMeCustomerId = customerRes.id;
                await this.userBaseService.update(userBase.id, { pagarMeCustomerId });
                return { pagarMeCustomerId, userId: userBase.id };
            }
            else {
                const hashedPassword = await bcrypt.hash(createCustomerDto.password, 10);
                const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
                const tokenExpiresAt = new Date();
                tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
                const customerRes = await this.pagarMeService.createCustomer(this.preparePagarMeCustomerData(createCustomerDto.name, createCustomerDto.email, createCustomerDto.cpf, createCustomerDto.phone, createCustomerDto.postalCode, createCustomerDto.address, createCustomerDto.addressNumber, createCustomerDto.complement, createCustomerDto.province, createCustomerDto.city, createCustomerDto.state, undefined, createCustomerDto.birthdate));
                pagarMeCustomerId = customerRes.id;
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
    preparePagarMeCustomerData(name, email, cpf, phone, postalCode, address, addressNumber, complement, province, city, state, code, birthdate) {
        const doc = (cpf || '').replace(/\D/g, '');
        const dto = {
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
        if (birthdate)
            dto.birthdate = birthdate;
        if (code)
            dto.code = code;
        const phones = this.buildPagarMePhones(phone);
        if (phones)
            dto.phones = phones;
        return dto;
    }
    buildPagarMePhones(phone) {
        const digits = (phone || '').replace(/\D/g, '');
        if (digits.length < 10)
            return undefined;
        const countryCode = '55';
        let areaCode;
        let number;
        if (digits.length === 11 && digits.startsWith('9')) {
            areaCode = digits.slice(0, 2);
            number = digits.slice(2);
        }
        else if (digits.length === 10) {
            areaCode = digits.slice(0, 2);
            number = digits.slice(2);
        }
        else if (digits.length === 11) {
            areaCode = digits.slice(0, 2);
            number = digits.slice(2);
        }
        else if (digits.length >= 12 && digits.startsWith('55')) {
            areaCode = digits.slice(2, 4);
            number = digits.slice(4);
        }
        else {
            areaCode = digits.slice(0, 2);
            number = digits.slice(2).slice(-8);
        }
        if (!areaCode || !number)
            return undefined;
        const mobile = { country_code: countryCode, area_code: areaCode, number: number.slice(-9) };
        return { mobile_phone: mobile };
    }
    async buildBillingAddressFromAssinatura(assinatura) {
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
    async ensurePagarMeCustomer(userBase, createCustomerDto) {
        if (userBase.pagarMeCustomerId) {
            return userBase.pagarMeCustomerId;
        }
        const customerRes = await this.pagarMeService.createCustomer(this.preparePagarMeCustomerData(createCustomerDto.name, createCustomerDto.email, createCustomerDto.cpf, createCustomerDto.phone, createCustomerDto.postalCode, createCustomerDto.address, createCustomerDto.addressNumber, createCustomerDto.complement, createCustomerDto.province, createCustomerDto.city, createCustomerDto.state, userBase.id, createCustomerDto.birthdate));
        await this.userBaseService.update(userBase.id, { pagarMeCustomerId: customerRes.id });
        return customerRes.id;
    }
    async updateExistingUserBase(userBase, createCustomerDto, telefoneNormalizado, pagarMeCustomerId) {
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
            pagarMeCustomerId,
        };
        if (createCustomerDto.password) {
            updateData.password = await bcrypt.hash(createCustomerDto.password, 10);
        }
        await this.userBaseService.update(userBase.id, updateData);
    }
    async handleExistingCustomerWithoutSubscription(userBase, createCustomerDto, telefoneNormalizado) {
        const pagarMeCustomerId = await this.ensurePagarMeCustomer(userBase, createCustomerDto);
        await this.updateExistingUserBase(userBase, createCustomerDto, telefoneNormalizado, pagarMeCustomerId);
        return { pagarMeCustomerId, userId: userBase.id };
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
        let pagarMeCustomerId;
        const PLANOS_TESTE = [
            '677c76e6-0ab0-4626-87bd-23f13ad2cd76',
            'ca772fbf-d9c7-4ef7-9f6c-84e535c393f0',
        ];
        const isPlanoTeste = PLANOS_TESTE.includes(checkoutDto.planoId);
        if (userBase.pagarMeCustomerId) {
            pagarMeCustomerId = userBase.pagarMeCustomerId;
        }
        else if (isPlanoTeste) {
            pagarMeCustomerId = `cus_fake_test_${userBase.id}`;
        }
        else {
            throw new common_1.BadRequestException('Usuário não possui Id de pagamentos no gateway. Chame POST /assinaturas/customer antes.');
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
        let cardId = null;
        if (checkoutDto.billingType === 'CREDIT_CARD') {
            if (!checkoutDto.creditCardToken) {
                throw new common_1.BadRequestException('Token do cartão de crédito é obrigatório. A tokenização deve ser feita no frontend.');
            }
            creditCardToken = checkoutDto.creditCardToken;
            creditCardNumber = checkoutDto.creditCardNumber || null;
            creditCardBrand = checkoutDto.creditCardBrand || null;
            if (!isPlanoTeste) {
                try {
                    const billingAddress = {
                        country: 'BR',
                        state: userBase.state || '',
                        city: userBase.city || '',
                        zip_code: (userBase.postalCode || '').replace(/\D/g, ''),
                        line_1: [userBase.address, userBase.addressNumber].filter(Boolean).join(', '),
                        line_2: userBase.complement || '',
                    };
                    const cardRes = await this.pagarMeService.addCard(pagarMeCustomerId, creditCardToken, billingAddress);
                    cardId = cardRes.id;
                    if (!cardId) {
                        throw new common_1.BadRequestException('Cartão nao encontrado');
                    }
                }
                catch (error) {
                    (0, newrelic_logger_1.newRelicLog)('error', 'Erro ao vincular cartão no checkoutComplete', { error: error.message, customerId: pagarMeCustomerId });
                    throw new common_1.BadRequestException(`Erro ao vincular cartão: ${error.message || 'Erro desconhecido'}`);
                }
            }
        }
        if (checkoutDto.billingType === 'CREDIT_CARD' && !isPlanoTeste && !cardId) {
            throw new common_1.BadRequestException('Não foi possível vincular o cartão ao cliente.');
        }
        const planoEstudanteId = '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7';
        const isPlanoEstudante = checkoutDto.planoId === planoEstudanteId;
        let paymentResult = null;
        if (isPlanoEstudante && checkoutDto.billingType === 'CREDIT_CARD') {
            console.log('🎓 Plano Estudante: Processando cobrança imediata');
            if (!cardId) {
                throw new common_1.BadRequestException('Cartão não foi vinculado corretamente para o Plano Estudante.');
            }
            try {
                const orderCode = `estudante_${Date.now()}`;
                const line1 = [userBase.address, userBase.addressNumber].filter(Boolean).join(', ').trim() || '';
                const billingAddress = {
                    line_1: line1,
                    zip_code: (userBase.postalCode || '').replace(/\D/g, '') || '',
                    city: userBase.city || '',
                    state: userBase.state || '',
                    country: 'BR',
                    line_2: userBase.complement || undefined,
                };
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
                await this.registrarCobranca({
                    userId: null,
                    pagarMeOrderId: orderResult.id,
                    pagarMeCustomerId: pagarMeCustomerId,
                    value: valorFinal,
                    billingType: 'CREDIT_CARD',
                    status: orderResult.status === 'paid' ? 'paid' : 'pending',
                    dueDate: new Date(),
                    paymentDate: orderResult.status === 'paid' ? new Date() : null,
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
                console.log('✅ Cobrança imediata processada para Plano Estudante:', orderResult.id);
            }
            catch (error) {
                console.error('❌ Erro ao processar cobrança do Plano Estudante:', error.message);
                throw new common_1.BadRequestException(`Erro ao processar pagamento: ${error.message}`);
            }
        }
        else if (isPlanoTeste && checkoutDto.billingType === 'CREDIT_CARD') {
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
        }
        else if (checkoutDto.billingType === 'CREDIT_CARD' && !isPlanoEstudante) {
            console.log('✅ Cartão vinculado (card_id). Primeira cobrança em 5 dias pela recorrência.');
        }
        if (!clienteMaster) {
            clienteMaster = await this.clientesMasterService.create({
                userId: userBase.id,
            });
            if (isPlanoTeste) {
                console.log('✅ ClienteMaster criado para plano de teste:', clienteMaster.id);
            }
            else if (isPlanoEstudante) {
                console.log('✅ ClienteMaster criado para Plano Estudante (cobrança imediata):', clienteMaster.id);
            }
            else {
                console.log('✅ ClienteMaster criado. Período grátis de 5 dias ativado:', clienteMaster.id);
            }
        }
        let nextDueDateString;
        if (isPlanoEstudante || isPlanoTeste) {
            nextDueDateString = this.calcularProximoMes();
        }
        else {
            nextDueDateString = this.calcularProximos7Dias();
        }
        const nextDueDate = this.parseDataBrasil(nextDueDateString);
        const assinaturaData = {
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
            }
            else {
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
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Erro ao salvar assinatura no banco de dados: ${error.message || 'Erro desconhecido'}`);
        }
    }
    toResponseDto(subscription) {
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
        pagar_me_service_1.PagarMeService,
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