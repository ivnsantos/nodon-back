import { IsOptional, IsString, IsDateString } from 'class-validator';

export class AnalyticsQueryDto {
  @IsString()
  @IsOptional()
  clienteMasterId?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @IsString()
  @IsOptional()
  groupBy?: 'day' | 'week' | 'month' | 'year'; // Agrupar por período
}

