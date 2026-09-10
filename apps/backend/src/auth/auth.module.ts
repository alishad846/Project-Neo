import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { LoginRateLimiter } from "./login-rate-limit";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "neo-dev-secret",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, LoginRateLimiter],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
