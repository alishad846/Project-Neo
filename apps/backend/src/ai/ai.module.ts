import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ProductsModule } from '../products/products.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [HttpModule, ProductsModule, TransactionsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
