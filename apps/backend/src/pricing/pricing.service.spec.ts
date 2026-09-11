import { ProductsService } from "../products/products.service";
import { TransactionsService } from "../transactions/transactions.service";
import { PricingService } from "./pricing.service";

const fakeProducts = {
  getAllProducts: async () => [
    { id: 1, sku: "K1", title: "Kurti", category: "Women > Kurtis", weight: "0.40", costPrice: "450.00", sellingPrice: "899.00" },
  ],
} as unknown as ProductsService;

const fakeTxns = {} as TransactionsService;

describe("PricingService.calculateDryRun", () => {
  it("builds a dry-run from real SKUs and lowers price on a discount", async () => {
    const svc = new PricingService(fakeProducts, fakeTxns);
    const res = await svc.calculateDryRun({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 10 });
    expect(res.totalSkus).toBe(1);
    expect(res.diffs[0].proposedPrice).toBeLessThan(899);
  });
});

describe("PricingService.calculateDryRun with skus scoping", () => {
  const twoProducts = async () => [
    { id: 1, sku: "K1", title: "Kurti", category: "Women > Kurtis", weight: "0.40", costPrice: "450.00", sellingPrice: "899.00" },
    { id: 2, sku: "S1", title: "Saree", category: "Women > Sarees", weight: "0.60", costPrice: "800.00", sellingPrice: "1599.00" },
  ];

  it("only includes the requested skus in the dry-run", async () => {
    const products = { getAllProducts: twoProducts } as unknown as ProductsService;
    const svc = new PricingService(products, {} as TransactionsService);
    const res = await svc.calculateDryRun({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 10 }, ["K1"]);
    expect(res.totalSkus).toBe(1);
    expect(res.diffs[0].sku).toBe("K1");
  });

  it("includes everything when skus is omitted (unchanged default behavior)", async () => {
    const products = { getAllProducts: twoProducts } as unknown as ProductsService;
    const svc = new PricingService(products, {} as TransactionsService);
    const res = await svc.calculateDryRun({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 10 });
    expect(res.totalSkus).toBe(2);
  });
});
