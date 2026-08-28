import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'NEO_SUPER_SECRET_KEY', // In production, we will move this to a .env file!
      signOptions: { expiresIn: '7d' }, // Keeps the seller logged in for 7 days
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}