import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { db } from '../db/database'; // Assumes you export your Drizzle db instance here
import { sellers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  
  // NEW: Added the constructor to inject the JwtService
  constructor(private jwtService: JwtService) {}

  async signup(fullName: string, shopName: string, email: string, password: string) {
    // 1. Check if a seller with this email already exists
    const existingSeller = await db.select().from(sellers).where(eq(sellers.email, email));
    
    if (existingSeller.length > 0) {
      throw new ConflictException('A seller with this email already exists.');
    }

    // 2. Hash the password securely (never save plain text!)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Generate a unique ID for the seller
    const sellerId = randomUUID();

    // 4. Save the new seller into your PostgreSQL database
    const newSeller = await db.insert(sellers).values({
      id: sellerId,
      email: email,
      passwordHash: passwordHash,
      fullName: fullName,
      shopName: shopName,
    }).returning({
      // We use .returning() to get the saved data back, but we purposefully EXCLUDE the passwordHash
      id: sellers.id,
      email: sellers.email,
      fullName: sellers.fullName,
      shopName: sellers.shopName,
    });

    return newSeller[0];
  }

  async login(email: string, pass: string) {
    // 1. Find the seller by their email
    const existingSellers = await db.select().from(sellers).where(eq(sellers.email, email));
    const user = existingSellers[0];

    // If no user is found with that email, reject the login
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Compare the typed password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);

    // If the passwords don't match, reject the login
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // NEW: Generate the JWT payload and return the token alongside the user data
    const payload = { sub: user.id, email: user.email };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        shopName: user.shopName,
      }
    };
  }
}