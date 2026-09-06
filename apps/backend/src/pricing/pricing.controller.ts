import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import type { PricingRuleDto } from "./pricing.dto";
import { PricingService } from "./pricing.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("pricing")
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post("dry-run")
  dryRun(@Body() rule: PricingRuleDto) {
    return this.pricingService.calculateDryRun(rule);
  }

  @Post("apply")
  apply(@Body() body: { rule: PricingRuleDto }) {
    return this.pricingService.applyPrices(body.rule);
  }

  @Post("undo/:txnId")
  undo(@Param("txnId", ParseIntPipe) txnId: number) {
    return this.pricingService.undo(txnId);
  }
}
