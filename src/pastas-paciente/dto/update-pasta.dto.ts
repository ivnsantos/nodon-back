import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePastaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titulo?: string;
}
