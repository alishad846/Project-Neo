import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { signupRequestSchema, loginRequestSchema } from "./auth.dto";
import { BadRequestException } from "@nestjs/common";
import { PASSWORD_MESSAGE } from "@neo/genome";

describe("ZodValidationPipe (auth signup)", () => {
  const pipe = new ZodValidationPipe(signupRequestSchema);

  it("passes a valid body through", () => {
    const out = pipe.transform({
      fullName: "Priya",
      shopName: "Priya Boutique",
      email: "priya@example.com",
      password: "Neo12345",
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
        password: "Neo12345",
      }),
    ).toThrow(BadRequestException);
  });

  it("rejects a weak password with the shared policy message", () => {
    const result = signupRequestSchema.safeParse({
      fullName: "Priya",
      shopName: "Priya Boutique",
      email: "priya@example.com",
      password: "weak",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(PASSWORD_MESSAGE);
    }
  });

  it("accepts a password meeting the shared policy", () => {
    const result = signupRequestSchema.safeParse({
      fullName: "Priya",
      shopName: "Priya Boutique",
      email: "priya@example.com",
      password: "Neo12345",
    });
    expect(result.success).toBe(true);
  });
});

describe("ZodValidationPipe (auth login)", () => {
  const pipe = new ZodValidationPipe(loginRequestSchema);

  it("passes a valid body through", () => {
    const out = pipe.transform({ email: "priya@example.com", password: "correct-pw" });
    expect(out.email).toBe("priya@example.com");
  });

  it("still accepts a short password (policy not enforced on login)", () => {
    const result = loginRequestSchema.safeParse({ email: "priya@example.com", password: "a" });
    expect(result.success).toBe(true);
  });

  it("throws 400 when password is missing", () => {
    expect(() => pipe.transform({ email: "priya@example.com" })).toThrow(BadRequestException);
  });
});
