import { Controller, Post, Body } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('dry-run')
  async executeDryRun(@Body() rule: any) {
    return this.pricingService.calculateDryRun(rule);
  }

  @Post('apply')
  async applyPriceUpdate(@Body() payload: { rule: any, confirm: boolean }) {
    return this.pricingService.applyPrices(payload.rule);
  }
}