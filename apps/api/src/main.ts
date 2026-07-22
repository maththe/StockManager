import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Em produção o front vive em outro domínio (Vercel), então a origem precisa
// ser declarada em CORS_ORIGINS (lista separada por vírgula). Sem a variável
// — caso do ambiente local — a API reflete a origem que chamou.
//
// Refletir a origem, e não responder '*', é o que torna o CORS compatível com
// `credentials: true`: o navegador recusa '*' em requisição com credenciais.
function resolveCorsOrigin() {
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.enableCors({
    origin: resolveCorsOrigin(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // '0.0.0.0' é exigido por plataformas como a Render, que roteiam o tráfego
  // de fora do container; o padrão do Node ouviria só no loopback em alguns
  // ambientes e a porta apareceria como fechada no health check.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
