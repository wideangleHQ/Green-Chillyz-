import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { DeviceService } from './services/device.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { GoogleAuthDto, RegisterDto, LoginDto, RequestOtpDto, VerifyOtpDto, UpdateProfileDto } from './dto';
import { JwtPayload } from './interfaces';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly deviceService: DeviceService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register with email and password' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = this.extractIp(req);
    const userAgent = req.headers['user-agent'];
    const fingerprint =
      (req.headers['x-device-fingerprint'] as string) ?? null;

    const result = await this.authService.register(
      {
        fullName: dto.fullName,
        username: dto.username,
        email: dto.email,
        password: dto.password,
      },
      ipAddress,
      userAgent,
      fingerprint,
    );

    this.authService.setAuthCookies(res, result.tokens);

    return {
      user: result.user,
      message: 'Registration successful',
    };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email/username and password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = this.extractIp(req);
    const userAgent = req.headers['user-agent'];
    const fingerprint =
      (req.headers['x-device-fingerprint'] as string) ?? null;

    const result = await this.authService.loginWithCredentials(
      dto.identifier,
      dto.password,
      ipAddress,
      userAgent,
      fingerprint,
    );

    this.authService.setAuthCookies(res, result.tokens);

    return {
      user: result.user,
    };
  }

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Authenticate with Google via Supabase' })
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = this.extractIp(req);
    const userAgent = req.headers['user-agent'];
    const fingerprint =
      (req.headers['x-device-fingerprint'] as string) ?? null;

    const result = await this.authService.authenticateWithGoogle(
      dto.accessToken,
      ipAddress,
      userAgent,
      fingerprint,
    );

    this.authService.setAuthCookies(res, result.tokens);

    return {
      user: result.user,
      isNewUser: result.isNewUser,
    };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshCookieName = 'gc_refresh_token';
    const rawRefreshToken = req.cookies?.[refreshCookieName];

    if (!rawRefreshToken) {
      return { message: 'No refresh token provided' };
    }

    const ipAddress = this.extractIp(req);
    const userAgent = req.headers['user-agent'];

    const tokens = await this.authService.refreshTokens(
      rawRefreshToken,
      ipAddress,
      userAgent,
    );

    this.authService.setAuthCookies(res, tokens);
    return { message: 'Tokens refreshed successfully' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout current session' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sub, user.sessionId);
    this.authService.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout all sessions' })
  async logoutAll(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.sub);
    this.authService.clearAuthCookies(res);
    return { message: 'All sessions logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List user devices' })
  async getDevices(@CurrentUser() user: JwtPayload) {
    return this.deviceService.getUserDevices(user.sub);
  }

  @Delete('devices/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a device and revoke its sessions' })
  async removeDevice(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) deviceId: string,
  ) {
    await this.deviceService.logoutDevice(user.sub, deviceId);
    await this.tokenService.revokeTokensByDevice(user.sub, deviceId);
    return { message: 'Device removed successfully' };
  }

  @Public()
  @Post('request-otp')
  @ApiOperation({ summary: 'Request an OTP' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    const result = await this.otpService.requestOtp(
      dto.identifier,
      dto.purpose,
    );
    return {
      message: 'OTP sent successfully',
      expiresAt: result.expiresAt,
    };
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify an OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    await this.otpService.verifyOtp(dto.identifier, dto.code, dto.purpose);
    return { message: 'OTP verified successfully', verified: true };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.sub, dto);
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? '0.0.0.0';
  }
}
