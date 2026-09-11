import { Injectable } from "@nestjs/common";
import { executeDryRun, type SkuCosting, type PricingRule } from "@neo/rules-engine";
import { ProductsService } from "../products/products.service";
import { TransactionsService } from "../transactions/transactions.service";

function toCosting(g: {
  sku: string; category: string | null; weight: string | null; costPrice: string | null; sellingPrice: string | null;
}): SkuCosting {
  return {
    sku: g.sku,
    currentPrice: parseFloat(g.sellingPrice ?? "0"),
    baseCost: parseFloat(g.costPrice ?? "0"),
    weightKg: parseFloat(g.weight ?? "0.5"),
    category: g.category ?? "*",
  };
}

@Injectable()
export class PricingService {
  constructor(
    private readonly products: ProductsService,
    private readonly transactions: TransactionsService,
  ) {}

  // skus omitted/empty => every product (unchanged default behavior);
  // present => only those SKUs.
  private async scopedGenomes(skus?: string[], sellerId?: string) {
    const genomes = await this.products.getAllProducts(sellerId);
    if (!skus || skus.length === 0) return genomes;
    const wanted = new Set(skus);
    return genomes.filter((g) => wanted.has(g.sku));
  }

  async calculateDryRun(rule: PricingRule, skus?: string[], sellerId?: string) {
    const genomes = await this.scopedGenomes(skus, sellerId);
    const costs = genomes.map(toCosting);
    return executeDryRun(rule, costs, new Date());
  }

  async applyPrices(rule: PricingRule, skus?: string[], sellerId?: string) {
    const genomes = await this.scopedGenomes(skus, sellerId);
    const costs = genomes.map(toCosting);
    const dry = executeDryRun(rule, costs, new Date());

    const snapshot = dry.diffs.map((d, i) => ({
      productId: genomes[i].id,
      previousPrice: genomes[i].sellingPrice ?? "0",
    }));

    const txn = await this.transactions.createPriceTxn(snapshot, dry.diffs);
    try {
      for (let i = 0; i < dry.diffs.length; i++) {
        await this.products.updateProduct(genomes[i].id, {
          sellingPrice: dry.diffs[i].proposedPrice.toFixed(2),
        }, sellerId);
      }
    } catch (e) {
      await this.transactions.rollbackPriceTxn(txn.id);
      throw new Error(`apply failed for txn ${txn.id}, rolled back: ${(e as Error).message}`);
    }
    return { txnId: txn.id, updated: dry.diffs.length };
  }

  // Sets sellingPrice back to basePrice for matching products. Products
  // with no basePrice recorded (created before this feature, or never
  // saved through a path that sets it) are skipped, not zeroed.
  async resetPrices(skus?: string[], sellerId?: string) {
    const all = await this.scopedGenomes(skus, sellerId);
    const withBase = all.filter((g) => (g as { basePrice?: string | null }).basePrice != null);

    const snapshot = withBase.map((g) => ({
      productId: g.id,
      previousPrice: g.sellingPrice ?? "0",
    }));

    const txn = await this.transactions.createPriceTxn(snapshot);
    try {
      for (const g of withBase) {
        await this.products.updateProduct(g.id, {
          sellingPrice: (g as { basePrice?: string | null }).basePrice!,
        }, sellerId);
      }
    } catch (e) {
      await this.transactions.rollbackPriceTxn(txn.id);
      throw new Error(`reset failed for txn ${txn.id}, rolled back: ${(e as Error).message}`);
    }
    return { txnId: txn.id, updated: withBase.length };
  }

  async undo(txnId: number) {
    return this.transactions.rollbackPriceTxn(txnId);
  }
}
