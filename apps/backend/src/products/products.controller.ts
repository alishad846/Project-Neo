import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { Request } from 'express';

import { ProductsService } from './products.service';
import { productGenome } from '../db/schema';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { productGenomeInsertSchema } from '@neo/genome';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(productGenomeInsertSchema))
  createProduct(@Body() data: typeof productGenome.$inferInsert) {
    return this.productsService.createProduct(data);
  }

  @Post('images')
  uploadImage(@Body() body: { imageBase64: string; filename?: string }, @Req() req: Request) {
    const sellerId = (req as Request & { user?: { sub?: string } }).user?.sub;
    if (!sellerId) throw new UnauthorizedException('Authenticated seller identity is missing');
    return this.storageService
      .uploadImage(body.imageBase64, sellerId, body.filename ?? 'upload.jpg')
      .then((url) => ({ url }));
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