import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsOptional()
  message?: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsNotEmpty({ message: 'O clienteMasterId é obrigatório' })
  clienteMasterId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]; // Array de URLs ou base64 de imagens

  @IsOptional()
  @IsString()
  audio?: string; // URL ou base64 do áudio
}

export class ChatResponseDto {
  response: string;
  tokensUsed?: number;
  transcription?: string; // Transcrição do áudio (se enviado)
  imageUrls?: string[]; // URLs das imagens no S3 (se enviadas)
}
