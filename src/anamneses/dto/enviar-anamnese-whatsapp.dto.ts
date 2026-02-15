import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class EnviarAnamneseWhatsAppDto {
  @IsUUID()
  @IsNotEmpty()
  respostaAnamneseId: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

