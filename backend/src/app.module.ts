import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { AiModule } from './ai/ai.module';
import { PricingModule } from './pricing/pricing.module';

@Module({
  imports: [ProductsModule, AiModule, PricingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
