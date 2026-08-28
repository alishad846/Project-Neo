import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // NEW: Enable CORS so your React frontend can communicate with this API
  app.enableCors();
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();