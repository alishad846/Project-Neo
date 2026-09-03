import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { db } from "../db/database";
import { AuthService } from "./auth.service";

jest.mock("../db/database", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

type FakeSeller = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string | null;
  shopName: string | null;
  createdAt: Date;
};

function mockSelectResult(rows: FakeSeller[]) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(rows),
    }),
  });
}

function mockInsertResult(row: Partial<FakeSeller>) {
  (db.insert as jest.Mock).mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([row]),
    }),
  });
}

describe("AuthService.signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hashes the password and returns the seller without passwordHash", async () => {
    mockSelectResult([]);
    let capturedValues: unknown;
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockImplementation((v: unknown) => {
        capturedValues = v;
        return {
          returning: jest.fn().mockResolvedValue([
            {
              id: (v as FakeSeller).id,
              email: (v as FakeSeller).email,
              fullName: (v as FakeSeller).fullName,
              shopName: (v as FakeSeller).shopName,
              createdAt: new Date(),
            },
          ]),
        };
      }),
    });

    const jwtService = { signAsync: jest.fn() } as any;
    const svc = new AuthService(jwtService);

    const result = await svc.signup("Priya", "Priya Boutique", "priya@example.com", "plaintext-pw");

    expect((capturedValues as FakeSeller).passwordHash).not.toBe("plaintext-pw");
    expect(result).not.toHaveProperty("passwordHash");
    expect(result.email).toBe("priya@example.com");
  });

  it("throws ConflictException when the email already exists", async () => {
    mockSelectResult([
      {
        id: "existing-id",
        email: "priya@example.com",
        passwordHash: "hash",
        fullName: "Priya",
        shopName: "Priya Boutique",
        createdAt: new Date(),
      },
    ]);

    const jwtService = { signAsync: jest.fn() } as any;
    const svc = new AuthService(jwtService);

    await expect(
      svc.signup("Priya", "Priya Boutique", "priya@example.com", "plaintext-pw"),
    ).rejects.toThrow(ConflictException);
  });
});

describe("AuthService.login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an access_token and user (without passwordHash) on valid creds", async () => {
    const passwordHash = await bcrypt.hash("correct-pw", 10);
    mockSelectResult([
      {
        id: "seller-1",
        email: "priya@example.com",
        passwordHash,
        fullName: "Priya",
        shopName: "Priya Boutique",
        createdAt: new Date(),
      },
    ]);

    const jwtService = { signAsync: jest.fn().mockResolvedValue("signed-jwt-token") } as any;
    const svc = new AuthService(jwtService);

    const result = await svc.login("priya@example.com", "correct-pw");

    expect(result.access_token).toBe("signed-jwt-token");
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user.email).toBe("priya@example.com");
  });

  it("throws UnauthorizedException for an unknown email", async () => {
    mockSelectResult([]);
    const jwtService = { signAsync: jest.fn() } as any;
    const svc = new AuthService(jwtService);

    await expect(svc.login("nobody@example.com", "whatever")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("throws UnauthorizedException for a wrong password", async () => {
    const passwordHash = await bcrypt.hash("correct-pw", 10);
    mockSelectResult([
      {
        id: "seller-1",
        email: "priya@example.com",
        passwordHash,
        fullName: "Priya",
        shopName: "Priya Boutique",
        createdAt: new Date(),
      },
    ]);

    const jwtService = { signAsync: jest.fn() } as any;
    const svc = new AuthService(jwtService);

    await expect(svc.login("priya@example.com", "wrong-pw")).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
