import { User } from './user.entity';
import { Assinatura } from '../../assinaturas/entities/assinatura.entity';
export declare class ClienteMaster {
    id: string;
    nome: string;
    email: string;
    password: string;
    telefone: string;
    cnpj: string;
    ativo: boolean;
    createdAt: Date;
    updatedAt: Date;
    usuarios: User[];
    assinaturas: Assinatura[];
}
