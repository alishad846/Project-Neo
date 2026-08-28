export interface PricingRuleDto {
  actionType: 'PERCENTAGE_DISCOUNT' | 'FLAT_DISCOUNT' | 'TARGET_MARGIN' | 'SET_FIXED';
  actionValue: number;
  floorPrice?: number;
  roundTo99?: boolean;
}