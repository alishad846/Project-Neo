import { Body, Controller, Param, ParseIntPipe, Post, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { AiService } from './ai.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

const extractRequestSchema = z.object({
  productId: z.number().int(),
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
  extract(@Body() body: { productId: number; imageBase64: string }) {
    return this.aiService.extractAttributes(body.productId, body.imageBase64);
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
