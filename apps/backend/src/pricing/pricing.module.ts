import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { ProductsModule } from '../products/products.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [ProductsModule, TransactionsModule],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
