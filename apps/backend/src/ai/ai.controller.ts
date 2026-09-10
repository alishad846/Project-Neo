import { Body, Controller, Param, ParseIntPipe, Post, UsePipes, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { AiService } from './ai.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(extractRequestSchema))
  extract(@Body() body: { productId?: number; category?: string; imageBase64: string; },
  @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    if (typeof body.productId === 'number') {
      return this.aiService.extractAttributes(body.productId, body.imageBase64,req.user.sub,);
    }
    return this.aiService.extractFromImage(body.imageBase64, body.category);
  }

  @Post('publish')
  @UseGuards(JwtAuthGuard)
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
  @Req() req: Request & { user: { sub: string; email: string } },
) {
  return this.aiService.publish(
    body.productId,
    body.title,
    body.attributes,
    {
      hsnCode: body.hsnCode,
      sellingPrice: body.sellingPrice,
    },
    req.user.sub,
  );
}
  @Post('undo/:txnId')
  @UseGuards(JwtAuthGuard)
  undo(
    @Param('txnId', ParseIntPipe) txnId: number,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.aiService.undo(txnId, req.user.sub);
  }
}
