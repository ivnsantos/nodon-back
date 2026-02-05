import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class VincularAnamnesePacienteDto {
  @IsUUID()
  @IsNotEmpty()
  anamneseId: string;

  @IsUUID()
  @IsNotEmpty()
  pacienteId: string;
}

