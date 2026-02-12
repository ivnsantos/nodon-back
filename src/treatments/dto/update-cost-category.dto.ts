import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CostCategoryType } from '../entities/cost-category.entity';

export class UpdateCostCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(CostCategoryType)
  @IsOptional()
  type?: CostCategoryType;
}

