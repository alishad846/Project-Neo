import { Body, Controller, Param, ParseIntPipe, Post, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { AiService } from './ai.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

// Image-first extraction: `imageBase64` is required. Either pass a `productId`
// (legacy: uses that product's category as the moondream hint) or an optional
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
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract')
  @UsePipes(new ZodValidationPipe(extractRequestSchema))
  extract(@Body() body: { productId?: number; category?: string; imageBase64: string }) {
    if (typeof body.productId === 'number') {
      return this.aiService.extractAttributes(body.productId, body.imageBase64);
    }
    return this.aiService.extractFromImage(body.imageBase64, body.category);
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
