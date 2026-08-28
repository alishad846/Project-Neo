import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { AiModule } from './ai/ai.module';
import { PricingModule } from './pricing/pricing.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [ProductsModule, AiModule, PricingModule, TransactionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
