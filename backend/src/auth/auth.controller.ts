import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: any) {
    const { fullName, shopName, email, password } = body;
    
    // Pass the data from Pranav's frontend directly into your new service
    return this.authService.signup(fullName, shopName, email, password);
  }

  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    
    // Send the email and password to the service for verification
    return this.authService.login(email, password);
  }
}