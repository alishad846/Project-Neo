import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { signupRequestSchema, loginRequestSchema, type SignupRequestDto, type LoginRequestDto } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @UsePipes(new ZodValidationPipe(signupRequestSchema))
  signup(@Body() body: SignupRequestDto) {
    return this.authService.signup(body.fullName, body.shopName, body.email, body.password);
  }

  @Post("login")
  @UsePipes(new ZodValidationPipe(loginRequestSchema))
  login(@Body() body: LoginRequestDto) {
    return this.authService.login(body.email, body.password);
  }
}
