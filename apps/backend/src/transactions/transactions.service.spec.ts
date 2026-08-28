import { ProductsService } from "../products/products.service";
import { TransactionsService } from "./transactions.service";

describe("TransactionsService.rollbackPriceTxn", () => {
  it("restores each snapshot's previous price through ProductsService", async () => {
    const updated: Array<{ id: number; price: string }> = [];
    const products = {
      updateProduct: async (id: number, data: { sellingPrice?: string }) => {
        updated.push({ id, price: data.sellingPrice! });
        return { id };
      },
    } as unknown as ProductsService;

    const svc = new TransactionsService(products);
    // Inject a fake txn row lookup for the unit test.
    (svc as unknown as { getTxn: (id: number) => Promise<unknown> }).getTxn = async () => ({
      id: 1,
      kind: "price",
      snapshot: [{ productId: 7, previousPrice: "799.00" }],
    });

    const res = await svc.rollbackPriceTxn(1);
    expect(res.restored).toBe(1);
    expect(updated).toEqual([{ id: 7, price: "799.00" }]);
  });
});
