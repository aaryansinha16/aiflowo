import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { SendMagicLinkDto, VerifyMagicLinkDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Send magic link to email
   */
  @Public()
  @Post('magic-link/send')
  async sendMagicLink(@Body() dto: SendMagicLinkDto) {
    return this.authService.sendMagicLink(dto.email, dto.redirectUrl);
  }

  /**
   * Verify magic link token and login
   */
  @Public()
  @Post('magic-link/verify')
  async verifyMagicLink(@Body() dto: VerifyMagicLinkDto) {
    return this.authService.verifyMagicLink(dto.token);
  }

  /**
   * Get current user profile (protected)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user: { id: string; email: string; name?: string; profile?: unknown }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profile: user.profile,
    };
  }

  /**
   * Logout (client-side token removal)
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
