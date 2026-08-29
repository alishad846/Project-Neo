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

  async calculateDryRun(rule: PricingRule) {
    const genomes = await this.products.getAllProducts();
    const skus = genomes.map(toCosting);
    return executeDryRun(rule, skus, new Date());
  }

  async applyPrices(rule: PricingRule) {
    const genomes = await this.products.getAllProducts();
    const skus = genomes.map(toCosting);
    const dry = executeDryRun(rule, skus, new Date());

    // dry.diffs[i] corresponds to genomes[i] (executeDryRun preserves input order),
    // so correlate by index rather than a sku-keyed Map: productGenome.sku has no
    // uniqueness constraint and duplicate skus would silently collapse in a Map.
    const snapshot = dry.diffs.map((d, i) => ({
      productId: genomes[i].id,
      previousPrice: genomes[i].sellingPrice ?? "0",
    }));

    const txn = await this.transactions.createPriceTxn(snapshot, dry.diffs);
    try {
      for (let i = 0; i < dry.diffs.length; i++) {
        await this.products.updateProduct(genomes[i].id, {
          sellingPrice: dry.diffs[i].proposedPrice.toFixed(2),
        });
      }
    } catch (e) {
      await this.transactions.rollbackPriceTxn(txn.id);
      throw new Error(`apply failed for txn ${txn.id}, rolled back: ${(e as Error).message}`);
    }
    return { txnId: txn.id, updated: dry.diffs.length };
  }

  async undo(txnId: number) {
    return this.transactions.rollbackPriceTxn(txnId);
  }
}
