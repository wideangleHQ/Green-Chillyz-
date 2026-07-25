import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtPayload } from '../auth/interfaces';
import { GameConfigurationService } from './services/game-configuration.service';
import { GameSessionService } from './services/game-session.service';
import { GameAnalyticsService } from './services/game-analytics.service';
import {
  CreateGameDto,
  UpdateGameDto,
  StartGameSessionDto,
  EndGameSessionDto,
  GameQueryDto,
  GameSessionQueryDto,
} from './dto/game.dto';
import { GAME_PERMISSIONS } from './constants/game.constants';

@ApiTags('Games Platform')
@Controller({ path: 'games', version: '1' })
export class GameController {
  constructor(
    private readonly gameConfigService: GameConfigurationService,
    private readonly gameSessionService: GameSessionService,
    private readonly gameAnalyticsService: GameAnalyticsService,
  ) {}

  // ─── Play Game Endpoints ────────────────────────────────
  
  @Post('sessions/start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Start a game session',
    description: 'Validates eligibility, checks daily limits, cooldowns, and creates an active game session.',
  })
  async startSession(
    @Body() dto: StartGameSessionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const reqDetails = {
      ip: req.ip || '127.0.0.1',
      device: req.headers['user-agent'] as string || 'Unknown Device',
      browser: this.parseBrowser(req.headers['user-agent'] as string),
    };
    return this.gameSessionService.startSession(user.sub, dto, reqDetails);
  }

  @Post('sessions/end')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'End a game session and claim reward',
    description: 'Ends a session, runs server-side validation on gameplay parameters, evaluates campaigns, and credits wallet.',
  })
  async endSession(
    @Body() dto: EndGameSessionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const reqDetails = {
      ip: req.ip || '127.0.0.1',
      device: req.headers['user-agent'] as string || 'Unknown Device',
      browser: this.parseBrowser(req.headers['user-agent'] as string),
    };
    return this.gameSessionService.endSession(user.sub, dto, reqDetails);
  }

  @Get('sessions/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user session history' })
  async getMySessions(
    @CurrentUser() user: JwtPayload,
    @Query() query: GameSessionQueryDto,
  ) {
    query.userId = user.sub;
    return this.gameSessionService.listSessions(query);
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get details of a specific game session' })
  async getSession(@Param('id') id: string) {
    return this.gameSessionService.getSession(id);
  }

  // ─── Game List Endpoints ────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all registered games' })
  async listGames(@Query() query: GameQueryDto) {
    return this.gameConfigService.findAll(query);
  }

  @Get(':idOrSlug')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a game by ID or Slug' })
  async getGame(@Param('idOrSlug') idOrSlug: string) {
    return this.gameConfigService.findByIdOrSlug(idOrSlug);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(GAME_PERMISSIONS.GAME_ANALYTICS)
  @ApiOperation({ summary: 'Get statistics and analytics for a game' })
  async getGameStats(@Param('id') id: string) {
    return this.gameAnalyticsService.getGameStats(id);
  }

  @Get(':id/leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get high score leaderboard for a game' })
  async getLeaderboard(@Param('id') id: string) {
    return this.gameAnalyticsService.getLeaderboard(id);
  }

  // ─── Admin Game Configuration Endpoints ─────────────────

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(GAME_PERMISSIONS.GAME_CREATE)
  @ApiOperation({ summary: 'Create a new game configuration (Admin)' })
  async createGame(@Body() dto: CreateGameDto) {
    return this.gameConfigService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(GAME_PERMISSIONS.GAME_UPDATE)
  @ApiOperation({ summary: 'Update a game configuration (Admin)' })
  async updateGame(@Param('id') id: string, @Body() dto: UpdateGameDto) {
    return this.gameConfigService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(GAME_PERMISSIONS.GAME_DELETE)
  @ApiOperation({ summary: 'Delete a game configuration (Admin)' })
  async deleteGame(@Param('id') id: string) {
    await this.gameConfigService.delete(id);
    return { message: 'Game deleted successfully' };
  }

  private parseBrowser(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }
}
