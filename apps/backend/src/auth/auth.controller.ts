import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(
    @Body() body: { fullName: string; shopName: string; email: string; password: string },
  ) {
    return this.authService.signup(body.fullName, body.shopName, body.email, body.password);
  }

  @Post("login")
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
