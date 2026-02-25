import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePastaDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  titulo: string;

  @IsNotEmpty()
  @IsUUID()
  pacienteId: string;
}
