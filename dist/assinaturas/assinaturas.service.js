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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const assinatura_entity_1 = require("./entities/assinatura.entity");
const cupom_entity_1 = require("../cupons/entities/cupom.entity");
const asaas_service_1 = require("./services/asaas.service");
const planos_service_1 = require("../planos/planos.service");
const cupons_service_1 = require("../cupons/cupons.service");
const clientes_master_service_1 = require("../users/clientes-master.service");
const users_service_1 = require("../users/users.service");
const user_base_service_1 = require("../users/services/user-base.service");
const user_comum_service_1 = require("../users/services/user-comum.service");
const email_service_1 = require("../email/email.service");
const historico_mensal_entity_1 = require("../analises/entities/historico-mensal.entity");
const chat_service_1 = require("../chat/chat.service");
let AssinaturasService = class AssinaturasService {
    assinaturaRepository;
    cupomRepository;
    historicoRepository;
    asaasService;
    planosService;
    cuponsService;
    clientesMasterService;
    usersService;
    userBaseService;
    userComumService;
    emailService;
    chatService;
    constructor(assinaturaRepository, cupomRepository, historicoRepository, asaasService, planosService, cuponsService, clientesMasterService, usersService, userBaseService, userComumService, emailService, chatService) {
        this.assinaturaRepository = assinaturaRepository;
        this.cupomRepository = cupomRepository;
        this.historicoRepository = historicoRepository;
        this.asaasService = asaasService;
        this.planosService = planosService;
        this.cuponsService = cuponsService;
        this.clientesMasterService = clientesMasterService;
        this.usersService = usersService;
        this.userBaseService = userBaseService;
        this.userComumService = userComumService;
        this.emailService = emailService;
        this.chatService = chatService;
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
        console.log('💰 Valor final que será enviado ao Asaas:', valorFinal);
        const asaasCustomerId = await this.asaasService.createCustomer({
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
        let creditCardToken = null;
        let creditCardNumber = null;
        let creditCardBrand = null;
        if (createSubscriptionDto.billingType === 'CREDIT_CARD') {
            if (!createSubscriptionDto.creditCardHolderName ||
                !createSubscriptionDto.creditCardNumber ||
                !createSubscriptionDto.creditCardExpiryMonth ||
                !createSubscriptionDto.creditCardExpiryYear ||
                !createSubscriptionDto.creditCardCcv) {
                throw new common_1.BadRequestException('Dados do cartão de crédito são obrigatórios');
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
            }
            catch (error) {
                throw new common_1.BadRequestException(`Erro ao tokenizar cartão: ${error.message || 'Erro desconhecido'}`);
            }
        }
        const nextDueDate = new Date();
        const nextDueDateString = nextDueDate.toISOString().split('T')[0];
        const valorParaAsaas = Number(valorFinal);
        console.log('📤 Enviando para Asaas:', {
            customer: asaasCustomerId,
            billingType: createSubscriptionDto.billingType,
            value: valorParaAsaas,
            planoNome: plano.nome,
            planoId: plano.id,
        });
        const subscriptionData = {
            customer: asaasCustomerId,
            billingType: createSubscriptionDto.billingType,
            value: valorParaAsaas,
            nextDueDate: nextDueDateString,
            cycle: 'MONTHLY',
            description: `Assinatura ${plano.nome} NODON`,
        };
        if (coupon && coupon.active) {
            subscriptionData.discount = {
                value: Number(coupon.discountValue),
                type: 'PERCENTAGE',
            };
        }
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
        const asaasSubscription = await this.asaasService.createSubscription(subscriptionData);
        const hashedPassword = await bcrypt.hash(createSubscriptionDto.password, 10);
        let userBase;
        try {
            const existingUserBase = await this.userBaseService.findByEmail(createSubscriptionDto.email);
            if (existingUserBase) {
                throw new common_1.ConflictException('Já existe um usuário cadastrado com este e-mail');
            }
            const existingClienteMaster = await this.clientesMasterService.findByEmail(createSubscriptionDto.email);
            let emailJaVerificado = false;
            if (existingClienteMaster) {
                const userBaseDoCliente = await this.userBaseService.findById(existingClienteMaster.userId);
                emailJaVerificado = userBaseDoCliente?.isVerified || false;
            }
            let verificationToken = null;
            let tokenExpiresAt = null;
            let isVerified = false;
            if (emailJaVerificado) {
                isVerified = true;
            }
            else {
                verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
                tokenExpiresAt = new Date();
                tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15);
            }
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
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Erro ao criar usuário: ${error.message || 'Erro desconhecido'}`);
        }
        let clienteMaster;
        try {
            clienteMaster = await this.clientesMasterService.create({
                userId: userBase.id,
            });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Erro ao criar cliente master: ${error.message || 'Erro desconhecido'}`);
        }
        const assinaturaData = {
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
        const existingSubscription = await this.assinaturaRepository.findOne({
            where: { userId: clienteMaster.id },
            order: { createdAt: 'DESC' },
        });
        let asaasCustomerId;
        if (existingSubscription && existingSubscription.asaasCustomerId) {
            asaasCustomerId = existingSubscription.asaasCustomerId;
        }
        else {
            asaasCustomerId = await this.asaasService.createCustomer({
                name: userBase.nome,
                email: userBase.email,
                cpfCnpj: userBase.cpf.replace(/\D/g, ''),
                phone: userBase.telefone.replace(/\D/g, ''),
                postalCode: userBase.postalCode.replace(/\D/g, ''),
                address: userBase.address,
                addressNumber: userBase.addressNumber || '',
                complement: userBase.complement || '',
                province: userBase.province || '',
                city: userBase.city,
                state: userBase.state,
            });
        }
        let creditCardToken = null;
        let creditCardNumber = null;
        let creditCardBrand = null;
        if (createSimpleSubscriptionDto.billingType === 'CREDIT_CARD') {
            if (!createSimpleSubscriptionDto.creditCardHolderName ||
                !createSimpleSubscriptionDto.creditCardNumber ||
                !createSimpleSubscriptionDto.creditCardExpiryMonth ||
                !createSimpleSubscriptionDto.creditCardExpiryYear ||
                !createSimpleSubscriptionDto.creditCardCcv) {
                throw new common_1.BadRequestException('Dados do cartão de crédito são obrigatórios');
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
            }
            catch (error) {
                throw new common_1.BadRequestException(`Erro ao tokenizar cartão: ${error.message || 'Erro desconhecido'}`);
            }
        }
        const nextDueDate = new Date();
        const nextDueDateString = nextDueDate.toISOString().split('T')[0];
        const subscriptionData = {
            customer: asaasCustomerId,
            billingType: createSimpleSubscriptionDto.billingType,
            value: valorFinal,
            nextDueDate: nextDueDateString,
            cycle: 'MONTHLY',
            description: `Assinatura ${plano.nome} NODON`,
        };
        if (coupon && coupon.active) {
            subscriptionData.discount = {
                value: Number(coupon.discountValue),
                type: 'PERCENTAGE',
            };
        }
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
        const asaasSubscription = await this.asaasService.createSubscription(subscriptionData);
        const assinaturaData = {
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
        }
        catch (error) {
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
                await this.assinaturaRepository.save(subscription);
                return { status: 'CONFIRMED' };
            }
            return { status: paymentStatus };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Erro ao verificar status do pagamento: ${error.message || 'Erro desconhecido'}`);
        }
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
exports.AssinaturasService = AssinaturasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assinatura_entity_1.Assinatura)),
    __param(1, (0, typeorm_1.InjectRepository)(cupom_entity_1.Cupom)),
    __param(2, (0, typeorm_1.InjectRepository)(historico_mensal_entity_1.HistoricoMensal)),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => clientes_master_service_1.ClientesMasterService))),
    __param(11, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        asaas_service_1.AsaasService,
        planos_service_1.PlanosService,
        cupons_service_1.CuponsService,
        clientes_master_service_1.ClientesMasterService,
        users_service_1.UsersService,
        user_base_service_1.UserBaseService,
        user_comum_service_1.UserComumService,
        email_service_1.EmailService,
        chat_service_1.ChatService])
], AssinaturasService);
//# sourceMappingURL=assinaturas.service.js.map