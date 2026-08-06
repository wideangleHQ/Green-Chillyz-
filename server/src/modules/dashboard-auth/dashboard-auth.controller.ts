import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  DashboardCurrentStore,
  DashboardPublic,
  DashboardRefreshToken,
  DashboardRequestMeta,
} from './decorators';
import {
  DashboardCurrentSessionDto,
  DashboardLoginDto,
  DashboardLoginResponseDto,
  DashboardMessageResponseDto,
  DashboardSessionDto,
  DashboardStoreContextDto,
} from './dto';
import { DashboardAuthGuard, DashboardRefreshGuard } from './guards';
import { DashboardPrincipal, DashboardRequestContext } from './interfaces';
import { DashboardAuthService, DashboardTokenService } from './services';

/**
 * Dashboard authentication surface for dashboard.greenchillyz.com.
 *
 * Thin by contract: each handler maps HTTP to one service call and writes
 * cookies. No branching, no validation, no business rules — those belong to
 * `DashboardAuthService`, which the future dashboard modules will reuse.
 *
 * Mounted under `/api/v1/dashboard/...`, sharing the backend and the services
 * with the customer API; only the controller namespace differs.
 */
@ApiTags('Dashboard Authentication')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/auth', version: '1' })
@UseGuards(DashboardAuthGuard)
export class DashboardAuthController {
  constructor(
    private readonly dashboardAuthService: DashboardAuthService,
    private readonly tokenService: DashboardTokenService,
  ) {}

  @DashboardPublic()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate a store with its access code',
    description:
      'The store access code is the only dashboard credential — there are no ' +
      'dashboard user accounts, usernames, emails or passwords. On success, ' +
      'HttpOnly dashboard cookies are set and the store context is returned. ' +
      'Repeated failures lock the store for a configurable period.',
  })
  @ApiOkResponse({ type: DashboardLoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid store access code' })
  @ApiTooManyRequestsResponse({ description: 'Login rate limit exceeded' })
  async login(
    @Body() dto: DashboardLoginDto,
    @DashboardRequestMeta() context: DashboardRequestContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DashboardLoginResponseDto> {
    const result = await this.dashboardAuthService.login(
      dto.accessCode,
      context,
    );

    this.tokenService.setAuthCookies(res, result.tokens);

    return {
      store: result.store,
      sessionId: result.sessionId,
      message: 'Dashboard login successful',
    };
  }

  @DashboardPublic()
  @UseGuards(DashboardRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the dashboard session tokens',
    description:
      'Consumes the refresh cookie and issues a new token pair. The presented ' +
      'token is revoked; replaying it burns the whole token family and its ' +
      'session.',
  })
  @ApiOkResponse({ type: DashboardMessageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid, expired or reused token' })
  async refresh(
    @DashboardRefreshToken() rawRefreshToken: string,
    @DashboardRequestMeta() context: DashboardRequestContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DashboardMessageResponseDto> {
    const tokens = await this.dashboardAuthService.refresh(
      rawRefreshToken,
      context,
    );

    this.tokenService.setAuthCookies(res, tokens);

    return { message: 'Dashboard tokens refreshed successfully' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End the current dashboard session' })
  @ApiOkResponse({ type: DashboardMessageResponseDto })
  async logout(
    @DashboardCurrentStore() principal: DashboardPrincipal,
    @DashboardRequestMeta() context: DashboardRequestContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DashboardMessageResponseDto> {
    await this.dashboardAuthService.logout(principal, context);
    this.tokenService.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End every dashboard session for this store',
    description:
      'Revokes all sessions and refresh tokens and invalidates access tokens ' +
      'already issued, including those held by other devices.',
  })
  @ApiOkResponse({ type: DashboardMessageResponseDto })
  async logoutAll(
    @DashboardCurrentStore() principal: DashboardPrincipal,
    @DashboardRequestMeta() context: DashboardRequestContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DashboardMessageResponseDto & { revokedSessions: number }> {
    const result = await this.dashboardAuthService.logoutAll(
      principal,
      context,
    );
    this.tokenService.clearAuthCookies(res);

    return {
      message: 'All dashboard sessions logged out successfully',
      revokedSessions: result.revokedSessions,
    };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Current dashboard store context',
    description:
      'Store identity, scope and permissions profile. Never contains customer ' +
      'information.',
  })
  @ApiOkResponse({ type: DashboardStoreContextDto })
  async getCurrentStore(
    @DashboardCurrentStore() principal: DashboardPrincipal,
  ): Promise<DashboardStoreContextDto> {
    return this.dashboardAuthService.getCurrentStore(principal);
  }

  @Get('session')
  @ApiOperation({ summary: 'Details of the session making this request' })
  @ApiOkResponse({ type: DashboardCurrentSessionDto })
  async getCurrentSession(
    @DashboardCurrentStore() principal: DashboardPrincipal,
  ): Promise<DashboardCurrentSessionDto> {
    return this.dashboardAuthService.getCurrentSession(principal);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List active dashboard sessions for this store' })
  @ApiOkResponse({ type: [DashboardSessionDto] })
  async listSessions(
    @DashboardCurrentStore() principal: DashboardPrincipal,
  ): Promise<DashboardSessionDto[]> {
    return this.dashboardAuthService.listSessions(principal);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke one dashboard session',
    description:
      'Scoped to the calling store; a session belonging to another store is ' +
      'reported as not found.',
  })
  @ApiOkResponse({ type: DashboardMessageResponseDto })
  async revokeSession(
    @DashboardCurrentStore() principal: DashboardPrincipal,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @DashboardRequestMeta() context: DashboardRequestContext,
  ): Promise<DashboardMessageResponseDto> {
    await this.dashboardAuthService.revokeSession(
      principal,
      sessionId,
      context,
    );

    return { message: 'Session revoked successfully' };
  }
}
