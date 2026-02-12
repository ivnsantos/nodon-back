import { IsUUID, IsNotEmpty } from 'class-validator';

export class CalculateTreatmentCostDto {
  @IsUUID()
  @IsNotEmpty()
  treatmentId: string;
}

