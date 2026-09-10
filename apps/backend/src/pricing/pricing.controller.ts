import { Body, Controller, Param, ParseIntPipe, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import type { PricingRuleDto } from "./pricing.dto";
import { PricingService } from "./pricing.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("pricing")
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  private sellerId(req: Request): string {
    const sellerId = (req as Request & { user?: { sub?: string } }).user?.sub;
    if (!sellerId) throw new UnauthorizedException("Authenticated seller identity is missing");
    return sellerId;
  }

  @Post("dry-run")
  dryRun(@Body() body: PricingRuleDto & { skus?: string[] }, @Req() req: Request) {
    return this.pricingService.calculateDryRun(body, body.skus, this.sellerId(req));
  }

  @Post("apply")
  apply(@Body() body: { rule: PricingRuleDto; skus?: string[] }, @Req() req: Request) {
    return this.pricingService.applyPrices(body.rule, body.skus, this.sellerId(req));
  }

  @Post("reset")
  reset(@Body() body: { skus?: string[] }, @Req() req: Request) {
    return this.pricingService.resetPrices(body.skus, this.sellerId(req));
  }

  @Post("undo/:txnId")
  undo(@Param("txnId", ParseIntPipe) txnId: number) {
    return this.pricingService.undo(txnId);
  }
}
