import { IsEnum } from 'class-validator';
import { StatusItemOrcamento } from '../entities/item-orcamento.entity';

export class UpdateItemStatusDto {
  @IsEnum(StatusItemOrcamento, { message: 'Status inválido' })
  status: StatusItemOrcamento;
}

