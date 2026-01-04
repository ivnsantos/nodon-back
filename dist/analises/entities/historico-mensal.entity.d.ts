import { ClienteMaster } from '../../users/entities/cliente-master.entity';
export declare class HistoricoMensal {
    id: string;
    clienteMasterId: string;
    clienteMaster: ClienteMaster;
    ano: number;
    mes: number;
    tokensUtilizados: number;
    analisesFeitas: number;
    createdAt: Date;
    updatedAt: Date;
}
