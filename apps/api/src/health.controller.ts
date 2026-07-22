import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

// Endpoint público de saúde. Serve para o health check da plataforma e para o
// front "acordar" a API antes do login em planos que hibernam o serviço.
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
