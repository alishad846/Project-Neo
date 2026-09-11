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
import { productGenomeCreateSchema, productGenomeUpdateSchema } from '@neo/genome';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  private sellerId(req: Request): string {
    const sellerId = (req as Request & { user?: { sub?: string } }).user?.sub;
    if (!sellerId) throw new UnauthorizedException('Authenticated seller identity is missing');
    return sellerId;
  }

  @Post()
  @UsePipes(new ZodValidationPipe(productGenomeCreateSchema))
  createProduct(@Body() data: Omit<typeof productGenome.$inferInsert, 'sellerId'>, @Req() req: Request) {
    return this.productsService.createProduct({ ...data, sellerId: this.sellerId(req) });
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
  getAllProducts(@Req() req: Request) {
    // Scope to the logged-in seller so a seller only ever sees their OWN
    // catalogue -- never other sellers' (or leftover demo) products.
    return this.productsService.getAllProducts(this.sellerId(req));
  }

  @Get(':id')
  getProductById(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.productsService.getProductById(id, this.sellerId(req));
  }
  @Patch(':id')
updateProduct(
  @Param('id', ParseIntPipe) id: number,
  @Body(new ZodValidationPipe(productGenomeUpdateSchema))
  data: Partial<typeof productGenome.$inferInsert>,
  @Req() req: Request,
) {
  return this.productsService.updateProduct(id, data, this.sellerId(req));
}
@Get(':id/history')
getProductHistory(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
  return this.productsService.getProductHistory(id, this.sellerId(req));
}
@Post(':id/rollback/:version')
rollbackProduct(
  @Param('id', ParseIntPipe) id: number,
  @Param('version', ParseIntPipe) version: number,
  @Req() req: Request,
) {
  return this.productsService.rollbackProduct(id, version, this.sellerId(req));
}
@Delete(':id')
archiveProduct(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
  return this.productsService.archiveProduct(id, this.sellerId(req));
}
@Post(':id/restore')
restoreProduct(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
  return this.productsService.restoreProduct(id, this.sellerId(req));
}
}
