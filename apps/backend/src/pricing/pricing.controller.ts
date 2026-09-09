import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { PricingRuleDto } from "./pricing.dto";
import { PricingService } from "./pricing.service";

@Controller("pricing")
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post("dry-run")
  @UseGuards(JwtAuthGuard)
  dryRun(
    @Body() rule: PricingRuleDto,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.pricingService.calculateDryRun(rule, req.user.sub);
  }

  @Post("apply")
  @UseGuards(JwtAuthGuard)
  apply(
    @Body() body: { rule: PricingRuleDto },
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.pricingService.applyPrices(body.rule, req.user.sub);
  }

  @Post("undo/:txnId")
  @UseGuards(JwtAuthGuard)
  undo(
    @Param("txnId", ParseIntPipe) txnId: number,
    @Req() req: Request & { user: { sub: string; email: string } },
  ) {
    return this.pricingService.undo(txnId);
  }
}