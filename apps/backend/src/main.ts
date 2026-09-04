import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Product photos are sent as base64 JSON to /ai/extract; the default 100kb
  // body limit rejects them with 413. Raise it well above a typical phone photo.
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));
  // The extension (chrome-extension:// origin) calls this API directly.
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
