import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { clientOrigins } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: clientOrigins() });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}
void bootstrap();
