import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { signupRequestSchema, loginRequestSchema } from "./auth.dto";
import { BadRequestException } from "@nestjs/common";

describe("ZodValidationPipe (auth signup)", () => {
  const pipe = new ZodValidationPipe(signupRequestSchema);

  it("passes a valid body through", () => {
    const out = pipe.transform({
      fullName: "Priya",
      shopName: "Priya Boutique",
      email: "priya@example.com",
      password: "plaintext-pw",
    });
    expect(out.email).toBe("priya@example.com");
  });

  it("throws 400 when password is missing", () => {
    expect(() =>
      pipe.transform({
        fullName: "Priya",
        shopName: "Priya Boutique",
        email: "priya@example.com",
      }),
    ).toThrow(BadRequestException);
  });

  it("throws 400 on an invalid email", () => {
    expect(() =>
      pipe.transform({
        fullName: "Priya",
        shopName: "Priya Boutique",
        email: "not-an-email",
        password: "plaintext-pw",
      }),
    ).toThrow(BadRequestException);
  });
});

describe("ZodValidationPipe (auth login)", () => {
  const pipe = new ZodValidationPipe(loginRequestSchema);

  it("passes a valid body through", () => {
    const out = pipe.transform({ email: "priya@example.com", password: "correct-pw" });
    expect(out.email).toBe("priya@example.com");
  });

  it("throws 400 when password is missing", () => {
    expect(() => pipe.transform({ email: "priya@example.com" })).toThrow(BadRequestException);
  });
});
