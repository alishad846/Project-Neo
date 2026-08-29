import { ProductsService } from "../products/products.service";
import { TransactionsService } from "../transactions/transactions.service";
import { PricingService } from "./pricing.service";

describe("PricingService.applyPrices", () => {
  it("snapshots prior prices, updates each SKU, and returns a txn id", async () => {
    const updates: Array<{ id: number; price: string }> = [];
    const products = {
      getAllProducts: async () => [
        { id: 1, sku: "K1", title: "Kurti", category: "Women > Kurtis", weight: "0.40", costPrice: "450.00", sellingPrice: "899.00" },
      ],
      updateProduct: async (id: number, data: { sellingPrice?: string }) => {
        updates.push({ id, price: data.sellingPrice! });
        return { id };
      },
    } as unknown as ProductsService;

    let captured: unknown;
    const txns = {
      createPriceTxn: async (snapshot: unknown) => { captured = snapshot; return { id: 42 }; },
    } as unknown as TransactionsService;

    const svc = new PricingService(products, txns);
    const res = await svc.applyPrices({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 10 });

    expect(res.txnId).toBe(42);
    expect(res.updated).toBe(1);
    expect(captured).toEqual([{ productId: 1, previousPrice: "899.00" }]);
    expect(updates[0].id).toBe(1);
    expect(parseFloat(updates[0].price)).toBeLessThan(899);
  });

  it("correlates genomes to diffs by index so duplicate skus are not dropped", async () => {
    const updates: Array<{ id: number; price: string }> = [];
    const products = {
      getAllProducts: async () => [
        { id: 1, sku: "DUP", title: "Kurti A", category: "Women > Kurtis", weight: "0.40", costPrice: "450.00", sellingPrice: "899.00" },
        { id: 2, sku: "DUP", title: "Kurti B", category: "Women > Kurtis", weight: "0.40", costPrice: "500.00", sellingPrice: "999.00" },
      ],
      updateProduct: async (id: number, data: { sellingPrice?: string }) => {
        updates.push({ id, price: data.sellingPrice! });
        return { id };
      },
    } as unknown as ProductsService;

    let captured: unknown;
    const txns = {
      createPriceTxn: async (snapshot: unknown) => { captured = snapshot; return { id: 43 }; },
    } as unknown as TransactionsService;

    const svc = new PricingService(products, txns);
    const res = await svc.applyPrices({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 10 });

    expect(res.updated).toBe(2);
    expect(captured).toEqual([
      { productId: 1, previousPrice: "899.00" },
      { productId: 2, previousPrice: "999.00" },
    ]);
    const updatedIds = updates.map((u) => u.id).sort();
    expect(updatedIds).toEqual([1, 2]);
  });

  it("auto-reverses (rolls back) on partial apply failure and rethrows with txn id", async () => {
    const updates: Array<{ id: number; price: string }> = [];
    const products = {
      getAllProducts: async () => [
        { id: 1, sku: "K1", title: "Kurti", category: "Women > Kurtis", weight: "0.40", costPrice: "450.00", sellingPrice: "899.00" },
        { id: 2, sku: "K2", title: "Saree", category: "Women > Sarees", weight: "0.60", costPrice: "800.00", sellingPrice: "1599.00" },
      ],
      updateProduct: async (id: number, data: { sellingPrice?: string }) => {
        if (updates.length === 1) {
          throw new Error("db exploded");
        }
        updates.push({ id, price: data.sellingPrice! });
        return { id };
      },
    } as unknown as ProductsService;

    let rolledBackTxnId: number | undefined;
    const txns = {
      createPriceTxn: async () => ({ id: 99 }),
      rollbackPriceTxn: async (id: number) => {
        rolledBackTxnId = id;
        return { restored: 1 };
      },
    } as unknown as TransactionsService;

    const svc = new PricingService(products, txns);

    await expect(
      svc.applyPrices({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 10 }),
    ).rejects.toThrow(/txn 99/);

    expect(rolledBackTxnId).toBe(99);
  });
});
