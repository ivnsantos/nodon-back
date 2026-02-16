import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrarOrcamentosPagosDto {
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês deve ser entre 1 e 12' })
  @IsNotEmpty({ message: 'Mês é obrigatório' })
  @Type(() => Number)
  mes: number;

  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2000, { message: 'Ano inválido' })
  @Max(2100, { message: 'Ano inválido' })
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  @Type(() => Number)
  ano: number;
}

