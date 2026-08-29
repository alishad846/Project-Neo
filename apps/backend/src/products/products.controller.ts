import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { productGenome } from '../db/schema';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { productGenomeInsertSchema } from '@neo/genome';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(productGenomeInsertSchema))
  createProduct(@Body() data: typeof productGenome.$inferInsert) {
    return this.productsService.createProduct(data);
  }

  @Get()
  getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Get(':id')
  getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductById(id);
  }
  @Patch(':id')
updateProduct(
  @Param('id', ParseIntPipe) id: number,
  @Body() data: Partial<typeof productGenome.$inferInsert>,
) {
  return this.productsService.updateProduct(id, data);
}
@Get(':id/history')
getProductHistory(@Param('id', ParseIntPipe) id: number) {
  return this.productsService.getProductHistory(id);
}
@Post(':id/rollback/:version')
rollbackProduct(
  @Param('id', ParseIntPipe) id: number,
  @Param('version', ParseIntPipe) version: number,
) {
  return this.productsService.rollbackProduct(id, version);
}
@Delete(':id')
archiveProduct(@Param('id', ParseIntPipe) id: number) {
  return this.productsService.archiveProduct(id);
}
@Post(':id/restore')
restoreProduct(@Param('id', ParseIntPipe) id: number) {
  return this.productsService.restoreProduct(id);
}
}