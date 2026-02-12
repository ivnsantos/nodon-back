import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { CostCategoryType } from '../entities/cost-category.entity';

export class CreateCostCategoryDto {
  @IsString()
  @IsOptional()
  clienteMasterId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CostCategoryType)
  @IsNotEmpty()
  type: CostCategoryType;
}

