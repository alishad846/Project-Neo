import { Body, Controller, HttpException, HttpStatus, Post, Req, UnauthorizedException, UsePipes } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { LoginRateLimiter } from "./login-rate-limit";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { signupRequestSchema, loginRequestSchema, type SignupRequestDto, type LoginRequestDto } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginRateLimiter: LoginRateLimiter,
  ) {}

  @Post("signup")
  @UsePipes(new ZodValidationPipe(signupRequestSchema))
  signup(@Body() body: SignupRequestDto) {
    return this.authService.signup(body.fullName, body.shopName, body.email, body.password);
  }

  @Post("login")
  @UsePipes(new ZodValidationPipe(loginRequestSchema))
  async login(@Body() body: LoginRequestDto, @Req() req: Request) {
    // In-memory, single-instance rate limit. Move to a shared store (e.g.
    // Redis) if the backend is ever horizontally scaled.
    const key = `${body.email}:${req.ip}`;
    const now = Date.now();

    if (this.loginRateLimiter.check(key, now).blocked) {
      throw new HttpException("Too many attempts, try again later", HttpStatus.TOO_MANY_REQUESTS);
    }

    try {
      const result = await this.authService.login(body.email, body.password);
      this.loginRateLimiter.recordSuccess(key, now);
      return result;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        this.loginRateLimiter.recordFailure(key, now);
      }
      throw err;
    }
  }
}
