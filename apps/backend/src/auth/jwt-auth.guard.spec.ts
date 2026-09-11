import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";

function makeContext(request: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  const payload = { sub: 1, email: "a@b.c" };

  const fakeJwtService = {
    verifyAsync: jest.fn(async (token: string) => {
      if (token === "good") return payload;
      throw new Error("invalid token");
    }),
  };

  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(fakeJwtService as any);
  });

  it("rejects when there is no Authorization header", async () => {
    const req: any = { headers: {} };
    await expect(guard.canActivate(makeContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a malformed header without a Bearer scheme", async () => {
    const req: any = { headers: { authorization: "Basic x" } };
    await expect(guard.canActivate(makeContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a header missing the scheme entirely", async () => {
    const req: any = { headers: { authorization: "good" } };
    await expect(guard.canActivate(makeContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects an invalid/expired token", async () => {
    const req: any = { headers: { authorization: "Bearer bad" } };
    await expect(guard.canActivate(makeContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("resolves true and sets req.user for a valid token", async () => {
    const req: any = { headers: { authorization: "Bearer good" } };
    await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);
    expect(req.user).toEqual(payload);
  });
});
