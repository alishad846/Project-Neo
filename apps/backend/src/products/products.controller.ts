import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  Req,
} from '@nestjs/common';

import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { productGenome } from '../db/schema';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { productGenomeInsertSchema } from '@neo/genome';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(productGenomeInsertSchema))
  createProduct(
    @Body() data: typeof productGenome.$inferInsert,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.productsService.createProduct({
      ...data,
    sellerId: req.user.sub,
  });
}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAllProducts(@Req() req: Request & { user: { sub: string; email: string } }) {
    return this.productsService.getAllProducts(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getProductById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.productsService.getProductById(id, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<typeof productGenome.$inferInsert>,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.productsService.updateProduct(id, data, req.user.sub);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  getProductHistory(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.productsService.getProductHistory(id, req.user.sub);
  }

  @Post(':id/rollback/:version')
  @UseGuards(JwtAuthGuard)
  rollbackProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('version', ParseIntPipe) version: number,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.productsService.rollbackProduct(id, version, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  archiveProduct(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.productsService.archiveProduct(id, req.user.sub);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard)
  restoreProduct(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.productsService.restoreProduct(id, req.user.sub);
  }
}