import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import type { PricingRuleDto } from "./pricing.dto";
import { PricingService } from "./pricing.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("pricing")
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post("dry-run")
  dryRun(@Body() body: PricingRuleDto & { skus?: string[] }) {
    return this.pricingService.calculateDryRun(body, body.skus);
  }

  @Post("apply")
  apply(@Body() body: { rule: PricingRuleDto; skus?: string[] }) {
    return this.pricingService.applyPrices(body.rule, body.skus);
  }

  @Post("reset")
  reset(@Body() body: { skus?: string[] }) {
    return this.pricingService.resetPrices(body.skus);
  }

  @Post("undo/:txnId")
  undo(@Param("txnId", ParseIntPipe) txnId: number) {
    return this.pricingService.undo(txnId);
  }
}
