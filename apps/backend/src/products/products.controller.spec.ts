import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { productGenomeInsertSchema } from "@neo/genome";
import { BadRequestException } from "@nestjs/common";

describe("ZodValidationPipe (genome insert)", () => {
  const pipe = new ZodValidationPipe(productGenomeInsertSchema);

  it("passes a valid body through", () => {
    const out = pipe.transform({ sellerId: "s1", sku: "K1" });
    expect(out.sku).toBe("K1");
  });

  it("throws 400 on an invalid body", () => {
    expect(() => pipe.transform({ sellerId: "" })).toThrow(BadRequestException);
  });
});
