import { Controller, Get, Head, HttpCode, HttpStatus } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Servidor está online',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      message: 'Servidor está online',
      timestamp: new Date().toISOString(),
    };
  }

  @Head('health')
  @HttpCode(HttpStatus.OK)
  healthHead() {
    // HEAD request não retorna body, apenas status code
    return;
  }
}

