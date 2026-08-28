import { describe, it, expect } from "vitest";
import type { MarketplaceAdapter, Txn } from "./types.js";

describe("adapter contract", () => {
  it("a conforming stub satisfies MarketplaceAdapter", () => {
    const txn: Txn = { id: "t1", adapterId: "meesho", createdAt: new Date().toISOString(), snapshot: {}, diff: {}, result: "success" };
    const stub: Pick<MarketplaceAdapter, "id" | "transport" | "rollback"> = {
      id: "meesho",
      transport: "panel",
      rollback: async () => {},
    };
    expect(stub.id).toBe("meesho");
    expect(txn.result).toBe("success");
  });
});
