import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class EnviarFeedbackWhatsAppDto {
  @IsUUID()
  @IsNotEmpty()
  respostaQuestionarioId: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

