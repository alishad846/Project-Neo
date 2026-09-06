import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { assertJwtSecret } from './auth/jwt-secret';

async function bootstrap() {
  try {
    assertJwtSecret(process.env);
  } catch (error) {
    // Fatal misconfiguration: log clearly and exit non-zero rather than
    // silently signing tokens with a weak/default secret in production.
    // eslint-disable-next-line no-console
    console.error('[bootstrap] Fatal startup error:', error instanceof Error ? error.message : error);
    throw error;
  }

  const app = await NestFactory.create(AppModule);
  // Product photos are sent as base64 JSON to /ai/extract; the default 100kb
  // body limit rejects them with 413. Raise it well above a typical phone photo.
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));
  // The extension (chrome-extension:// origin) calls this API directly.
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
  // Deterministic non-zero exit on any fatal startup error (e.g. a missing/default
  // JWT_SECRET in production), rather than relying on the unhandled-rejection path.
  // eslint-disable-next-line no-console
  console.error('[bootstrap] Failed to start:', error instanceof Error ? error.message : error);
  process.exit(1);
});
