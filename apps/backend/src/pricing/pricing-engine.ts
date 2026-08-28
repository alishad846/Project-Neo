import { PricingRuleDto } from './pricing.dto';

export class PricingEngine {
  public static executeDryRun(rule: PricingRuleDto, skus: any[]) {
    return skus.map(sku => {
      const currentMargin = this.calculateMargin(sku.currentPrice, sku);
      let proposedPrice = this.calculateProposedPrice(rule, sku);

      let floorApplied = false;
      if (rule.floorPrice && proposedPrice < rule.floorPrice) {
        proposedPrice = rule.floorPrice;
        floorApplied = true;
      }

      const breakeven = this.calculateBreakeven(sku);
      let isBelowBreakeven = false;
      if (proposedPrice < breakeven) {
        proposedPrice = breakeven;
        isBelowBreakeven = true;
      }

      if (rule.roundTo99) {
        proposedPrice = Math.floor(proposedPrice / 100) * 100 + 99;
      }

      const proposedMargin = this.calculateMargin(proposedPrice, sku);

      return {
        skuId: sku.id,
        title: sku.title,
        currentPrice: sku.currentPrice,
        proposedPrice: proposedPrice,
        currentEstimatedMargin: currentMargin,
        proposedEstimatedMargin: proposedMargin,
        breakevenPrice: breakeven,
        floorPriceApplied: floorApplied,
        isBelowBreakeven: isBelowBreakeven
      };
    });
  }

  private static calculateMargin(price: number, params: any): number {
    const x = params.returnRate;
    const k = 1 - x;
    const C = params.baseCost;
    const P = 5; 
    const Ship = params.shippingCharge;
    const gst = params.gstRate;
    const R_ship = 160; 
    const d = 0.10; 

    const revenue = k * price;
    const cogs = k * C;
    const returnLoss = (x * R_ship) + (x * d * C);
    const shipGst = k * 0.18 * Ship;
    const productGst = k * (price * gst / (1 + gst));

    return revenue - (cogs + P + returnLoss + shipGst + productGst);
  }

  private static calculateBreakeven(params: any): number {
    const x = params.returnRate;
    const k = 1 - x;
    const C = params.baseCost;
    const P = 5;
    const Ship = params.shippingCharge;
    const gst = params.gstRate;
    const R_ship = 160;
    const d = 0.10;

    const numerator = P + (x * R_ship) + (x * d * C);
    const base = (numerator / k) + C + (0.18 * Ship);
    return base * (1 + gst);
  }

  private static calculateProposedPrice(rule: PricingRuleDto, sku: any): number {
    switch(rule.actionType) {
      case 'PERCENTAGE_DISCOUNT':
        return sku.currentPrice * (1 - (rule.actionValue / 100));
      case 'FLAT_DISCOUNT':
        return sku.currentPrice - rule.actionValue;
      case 'SET_FIXED':
        return rule.actionValue;
      case 'TARGET_MARGIN':
        const T = rule.actionValue;
        const x = sku.returnRate;
        const k = 1 - x;
        const C = sku.baseCost;
        const P = 5;
        const Ship = sku.shippingCharge;
        const gst = sku.gstRate;
        const R_ship = 160;
        const d = 0.10;
        
        const num = T + P + (x * R_ship) + (x * d * C);
        const base = (num / k) + C + (0.18 * Ship);
        return base * (1 + gst);
      default:
        return sku.currentPrice;
    }
  }
}