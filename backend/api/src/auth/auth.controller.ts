import { Controller, Get, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Get('registration-options')
  async getRegistrationOptions() {
    return this.authService.getRegistrationOptions();
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    const user = await this.authService.validateUser(signInDto.email, signInDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() registerDto: Record<string, any>) {
    return this.authService.registerStudent(registerDto as any);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body('identifier') identifier: string) {
    return this.authService.requestPasswordReset(identifier);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() resetDto: { identifier: string; otp: string; newPassword: string }) {
    return this.authService.resetPassword(resetDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-phone-token')
  async verifyPhoneToken(@Body() phoneDto: { phoneToken?: string; phone: string; newPassword?: string }) {
    return this.authService.verifyPhoneToken(phoneDto);
  }
}
