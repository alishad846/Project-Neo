import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { AiService } from './ai.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Image-first extraction: `imageBase64` is required. Either pass a `productId`
// (legacy: uses that product's category as the vision-model hint) or an optional
// `category` string hint directly. The production extension uses the latter so
// autofill isn't tied to a seeded catalogue product.
const extractRequestSchema = z.object({
  productId: z.number().int().optional(),
  category: z.string().optional(),
  imageBase64: z.string().min(1),
});

const publishRequestSchema = z.object({
  productId: z.number().int(),
  title: z.string().min(1),
  attributes: z.record(z.unknown()),
  hsnCode: z.string().optional(),
  sellingPrice: z.string().optional(),
});

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Called when the seller opens the AI Autofill tab to pre-load the vision
  // model. GET so it's a trivial no-body ping; returns fast, warms in the bg.
  @Get('warmup')
  warmup() {
    return this.aiService.warmup();
  }

  @Post('extract')
  @UsePipes(new ZodValidationPipe(extractRequestSchema))
  extract(
    @Body() body: { productId?: number; category?: string; imageBase64: string },
    @Req() req: Request,
  ) {
    if (typeof body.productId === 'number') {
      return this.aiService.extractAttributes(body.productId, body.imageBase64);
    }
    const sellerId = (req as Request & { user?: { sub?: string } }).user?.sub;
    return this.aiService.extractFromImage(body.imageBase64, body.category, sellerId);
  }

  @Post('publish')
  @UsePipes(new ZodValidationPipe(publishRequestSchema))
  publish(
    @Body()
    body: {
      productId: number;
      title: string;
      attributes: Record<string, unknown>;
      hsnCode?: string;
      sellingPrice?: string;
    },
  ) {
    return this.aiService.publish(body.productId, body.title, body.attributes, {
      hsnCode: body.hsnCode,
      sellingPrice: body.sellingPrice,
    });
  }

  @Post('undo/:txnId')
  undo(@Param('txnId', ParseIntPipe) txnId: number) {
    return this.aiService.undo(txnId);
  }
}
