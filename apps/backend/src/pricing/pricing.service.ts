import { Injectable } from '@nestjs/common';
// import { db } from '../db/database'; 
// import { productGenome } from '../db/schema'; 
// import { eq } from 'drizzle-orm';
import { PricingEngine } from './pricing-engine'; 

@Injectable()
export class PricingService {
  
  async calculateDryRun(rule: any) {
    // TEMPORARY MOCK DATA (Bypassing DB so we can test without .env)
    const mockSkus = [
      { sku: 'KURTI-001', title: 'Red Cotton Kurti', sellingPrice: '899', costPrice: '450' },
      { sku: 'KURTI-002', title: 'Blue Silk Kurti', sellingPrice: '1299', costPrice: '700' }
    ];

    const engineInput = mockSkus.map(record => ({
      id: record.sku,
      title: record.title || 'Untitled',
      currentPrice: parseFloat(record.sellingPrice) || 0,
      baseCost: parseFloat(record.costPrice) || 0,
      shippingCharge: 56.0, 
      gstRate: 0.05,        
      returnRate: 0.15      
    }));

    const impactedSkus = PricingEngine.executeDryRun(rule, engineInput);

    const estimatedTotalMarginDelta = impactedSkus.reduce((total: number, sku: any) => {
      return total + (sku.proposedEstimatedMargin - sku.currentEstimatedMargin);
    }, 0);

    return {
      ruleSummary: `Applied action: ${rule.actionType}`,
      totalSkusEvaluated: impactedSkus.length,
      impactedSkus: impactedSkus,
      estimatedTotalMarginDelta: estimatedTotalMarginDelta
    };
  }

  async applyPrices(rule: any) {
    const dryRunResults = await this.calculateDryRun(rule);

    console.log("Saving snapshot to transaction history...", dryRunResults.impactedSkus);

    // TEMPORARY DB BYPASS
    console.log("Mocking DB Update for SKUs...");
    
    return { success: true, message: `Successfully updated ${dryRunResults.totalSkusEvaluated} SKUs.` };
  }
}