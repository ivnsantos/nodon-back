import { ClienteMaster } from './cliente-master.entity';
export declare enum UserType {
    MASTER = "master",
    ADMIN = "admin",
    USER = "usuario"
}
export declare class User {
    id: string;
    nome: string;
    email: string;
    password: string;
    tipo: UserType;
    clienteMasterId: string;
    clienteMaster: ClienteMaster;
    ativo: boolean;
    createdAt: Date;
    updatedAt: Date;
}
