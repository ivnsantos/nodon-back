import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  @UseGuards(JwtAuthGuard)
  async sendMessageStream(@Body() chatMessageDto: ChatMessageDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Desabilita buffering no nginx

    try {
      const stream = await this.chatService.sendMessageStream(chatMessageDto);
      let fullResponse = '';
      let tokensUsed = 0;

      stream.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Enviar tokens usados e finalizar
              const normalizedResponse = this.chatService.normalizeResponse(fullResponse);
              res.write(`data: ${JSON.stringify({ type: 'done', tokensUsed, response: normalizedResponse })}\n\n`);
              res.end();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              
              if (delta) {
                fullResponse += delta;
                // Enviar chunk para o cliente
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
              }

              // Capturar tokens usados quando disponível
              if (parsed.usage?.total_tokens) {
                tokensUsed = parsed.usage.total_tokens;
              }
            } catch (e) {
              // Ignorar linhas inválidas
            }
          }
        }
      });

      stream.on('error', (error) => {
        console.error('Erro no stream:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Erro ao processar resposta' })}\n\n`);
        res.end();
      });

      stream.on('end', () => {
        if (!res.writableEnded) {
          const normalizedResponse = this.chatService.normalizeResponse(fullResponse);
          res.write(`data: ${JSON.stringify({ type: 'done', tokensUsed, response: normalizedResponse })}\n\n`);
          res.end();
        }
      });
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Body() chatMessageDto: ChatMessageDto): Promise<ChatResponseDto> {
    return this.chatService.sendMessage(chatMessageDto);
  }

}
