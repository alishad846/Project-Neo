import { Module } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { ProductsModule } from "../products/products.module";

@Module({
  imports: [ProductsModule],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
