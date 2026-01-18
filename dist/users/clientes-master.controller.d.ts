import { ClientesMasterService } from './clientes-master.service';
import { UpdateClienteMasterDto } from './dto/update-cliente-master.dto';
import { StorageService } from '../storage/storage.service';
import { UserComumService } from './services/user-comum.service';
import { RegisterUserByHashDto } from './dto/register-user-by-hash.dto';
import { UpdateUsuarioStatusDto } from './dto/update-usuario-status.dto';
import { UserBaseService } from './services/user-base.service';
import { AuthService } from '../auth/auth.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
export declare class ClientesMasterController {
    private clientesMasterService;
    private storageService;
    private userComumService;
    private userBaseService;
    private authService;
    private assinaturasService;
    constructor(clientesMasterService: ClientesMasterService, storageService: StorageService, userComumService: UserComumService, userBaseService: UserBaseService, authService: AuthService, assinaturasService: AssinaturasService);
    findAll(): Promise<import("./entities/cliente-master.entity").ClienteMaster[]>;
    getClienteMasterByHash(hash: string): Promise<{
        clienteMaster: {
            id: string;
            hash: string | null;
            nomeEmpresa: string;
            cnpj: string;
            logo: string;
            cor: string;
            telefoneEmpresa: string;
            site: string;
            descricao: string;
            outrasInformacoes: string;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
            id: string;
            nome: string;
            email: string;
        } | null;
        assinatura: {
            id: string;
            status: string;
        } | null;
    }>;
    findOne(id: string): Promise<import("./entities/cliente-master.entity").ClienteMaster | null>;
    getCompleteInfo(clienteMasterIdHeader: string, req: any): Promise<{
        userComum: {
            id: any;
            userId: any;
            clienteMasterId: any;
            ativo: any;
            status: any;
            createdAt: any;
            updatedAt: any;
        };
        clienteMasterId: string;
        assinatura: {
            status: string;
        } | null;
        relacionamento: {
            tipo: "usuario";
            id: string;
            status: any;
        };
    } | {
        relacionamento: {
            tipo: "clienteMaster";
            id: string;
            status?: undefined;
        };
        clienteMaster: {
            id: string;
            hash: string | null;
            nomeEmpresa: string;
            cnpj: string;
            logo: string;
            cor: string;
            telefoneEmpresa: string;
            site: string;
            descricao: string;
            outrasInformacoes: string;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
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
            createdAt: Date;
            updatedAt: Date;
        };
        assinatura: {
            id: string;
            status: string;
            userId?: undefined;
            asaasCustomerId?: undefined;
            asaasSubscriptionId?: undefined;
            name?: undefined;
            email?: undefined;
            cpf?: undefined;
            phone?: undefined;
            postalCode?: undefined;
            address?: undefined;
            addressNumber?: undefined;
            complement?: undefined;
            province?: undefined;
            city?: undefined;
            state?: undefined;
            value?: undefined;
            billingType?: undefined;
            planoId?: undefined;
            couponId?: undefined;
            createdAt?: undefined;
            updatedAt?: undefined;
        };
        plano: null;
        usuarios: {
            id: string;
            userId: string;
            clienteMasterId: string;
            ativo: boolean;
            status: "ativo" | "inativo";
            createdAt: Date;
            updatedAt: Date;
            user: {
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
                createdAt: Date;
                updatedAt: Date;
            } | null;
        }[];
        userComum?: undefined;
        clienteMasterId?: undefined;
    } | {
        relacionamento: {
            tipo: "clienteMaster";
            id: string;
            status?: undefined;
        };
        clienteMaster: {
            id: string;
            hash: string | null;
            nomeEmpresa: string;
            cnpj: string;
            logo: string;
            cor: string;
            telefoneEmpresa: string;
            site: string;
            descricao: string;
            outrasInformacoes: string;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
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
            createdAt: Date;
            updatedAt: Date;
        };
        assinatura: {
            id: string;
            userId: string;
            asaasCustomerId: string;
            asaasSubscriptionId: string;
            name: string;
            email: string;
            cpf: string;
            phone: string;
            postalCode: string;
            address: string;
            addressNumber: string;
            complement: string;
            province: string;
            city: string;
            state: string;
            value: number;
            billingType: string;
            status: string;
            planoId: string;
            couponId: string | undefined;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        plano: {
            id: any;
            nome: any;
            descricao: any;
            valorOriginal: any;
            valorPromocional: any;
            tokenChat: any;
            limiteAnalises: any;
            acesso: any;
            ativo: any;
            createdAt: any;
            updatedAt: any;
        } | null;
        usuarios: {
            id: string;
            userId: string;
            clienteMasterId: string;
            ativo: boolean;
            status: "ativo" | "inativo";
            createdAt: Date;
            updatedAt: Date;
            user: {
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
                createdAt: Date;
                updatedAt: Date;
            } | null;
        }[];
        userComum?: undefined;
        clienteMasterId?: undefined;
    }>;
    atualizarMeusDados(req: any, updateDto: UpdateClienteMasterDto, file: any): Promise<{
        message: string;
        clienteMaster: {
            id: string;
            nomeEmpresa: string;
            cnpj: string;
            logo: string;
            cor: string;
            telefoneEmpresa: string;
            site: string;
            descricao: string;
            outrasInformacoes: string;
            ativo: boolean;
        };
    }>;
    update(id: string, data: any): Promise<import("./entities/cliente-master.entity").ClienteMaster>;
    delete(id: string): Promise<{
        message: string;
    }>;
    registerUserByHash(hash: string, registerDto: RegisterUserByHashDto, authorization?: string): Promise<{
        message: string;
        user: {
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
            createdAt: Date;
            updatedAt: Date;
        } | null;
        userComum: {
            id: string;
            userId: string;
            clienteMasterId: string;
            ativo: boolean;
            status: "ativo" | "inativo";
            createdAt: Date;
            updatedAt: Date;
        };
        access_token?: undefined;
    } | {
        message: string;
        access_token: string;
        user: {
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
            createdAt: Date;
            updatedAt: Date;
        };
        userComum: {
            id: string;
            userId: string;
            clienteMasterId: string;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
            status?: undefined;
        };
    }>;
    getUsuariosByClienteMaster(id: string, req: any): Promise<{
        quantidade: number;
        usuarios: {
            id: string;
            userId: string;
            clienteMasterId: string;
            ativo: boolean;
            status: "ativo" | "inativo";
            createdAt: Date;
            updatedAt: Date;
            user: {
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
                createdAt: Date;
                updatedAt: Date;
            } | null;
        }[];
    }>;
    updateUsuarioStatus(id: string, updateDto: UpdateUsuarioStatusDto, req: any): Promise<{
        message: string;
        usuario: {
            id: string;
            userId: string;
            clienteMasterId: string;
            ativo: boolean;
            status: "ativo" | "inativo";
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
