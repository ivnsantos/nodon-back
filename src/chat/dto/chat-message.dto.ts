import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'A mensagem é obrigatória' })
  message: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsNotEmpty({ message: 'O clienteMasterId é obrigatório' })
  clienteMasterId: string;
}

export class ChatResponseDto {
  response: string;
  tokensUsed?: number;
}
