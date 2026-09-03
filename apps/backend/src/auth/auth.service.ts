import { randomUUID } from "crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db/database";
import { sellers } from "../db/schema";

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signup(fullName: string, shopName: string, email: string, password: string) {
    const existing = await db.select().from(sellers).where(eq(sellers.email, email));
    if (existing[0]) {
      throw new ConflictException("A seller with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const inserted = await db
      .insert(sellers)
      .values({
        id: randomUUID(),
        email,
        passwordHash,
        fullName,
        shopName,
      })
      .returning({
        id: sellers.id,
        email: sellers.email,
        fullName: sellers.fullName,
        shopName: sellers.shopName,
        createdAt: sellers.createdAt,
      });

    return inserted[0];
  }

  async login(email: string, pass: string) {
    const rows = await db.select().from(sellers).where(eq(sellers.email, email));
    const user = rows[0];
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const matches = await bcrypt.compare(pass, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return {
      access_token: await this.jwtService.signAsync({ sub: user.id, email: user.email }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        shopName: user.shopName,
      },
    };
  }
}
