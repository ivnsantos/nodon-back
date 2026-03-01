import { UserBase } from './user-base.entity';
import { UserComum } from './user-comum.entity';
import { Assinatura } from '../../assinaturas/entities/assinatura.entity';
export declare class ClienteMaster {
    id: string;
    userId: string;
    user: UserBase;
    nomeEmpresa: string;
    cnpj: string;
    logo: string;
    cor: string;
    corSecundaria: string | null;
    telefoneEmpresa: string;
    site: string;
    endereco: string | null;
    descricao: string;
    outrasInformacoes: string;
    valorHora: number | null;
    hash: string | null;
    ativo: boolean;
    createdAt: Date;
    updatedAt: Date;
    usuarios: UserComum[];
    assinaturas: Assinatura[];
}
