import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtPayload } from '../auth/interfaces';
import {
  NotificationService,
  NotificationDispatcherService,
  NotificationTemplateService,
  NotificationPreferencesService,
  NotificationAnalyticsService,
} from './services';
import {
  NotificationQueryDto,
  UpdateNotificationPreferencesDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  SendNotificationDto,
  BroadcastNotificationDto,
} from './dto';
import { NOTIFICATION_PERMISSIONS } from './constants';

@ApiTags('Notifications')
@Controller({ path: 'notifications', version: '1' })
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly dispatcher: NotificationDispatcherService,
    private readonly templateService: NotificationTemplateService,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly analyticsService: NotificationAnalyticsService,
  ) {}

  // ─── Current user ─────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'List my notifications',
    description: 'Paginated feed, newest first. Expired items are excluded.',
  })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.list(user.sub, query);
  }

  @Get('me/latest')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Latest notifications for the bell dropdown',
    description: 'Small cached payload for fast drawer opening.',
  })
  async latest(@CurrentUser() user: JwtPayload) {
    return this.notificationService.getLatest(user.sub);
  }

  @Get('me/unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unread badge count (Redis-backed)' })
  async unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationService.getUnreadCount(user.sub);
  }

  @Get('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my notification preferences' })
  async getPreferences(@CurrentUser() user: JwtPayload) {
    return this.preferencesService.get(user.sub);
  }

  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update my notification preferences',
    description: 'Per-category and per-channel switches, including future channels.',
  })
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.preferencesService.update(user.sub, dto);
  }

  @Patch('me/read-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  async markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationService.markAllRead(user.sub);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'My notification counters' })
  async myStats(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getUserStats(user.sub);
  }

  // ─── Admin (before :id to avoid capture) ──────────────

  @Get('templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(NOTIFICATION_PERMISSIONS.TEMPLATE_MANAGE)
  @ApiOperation({ summary: 'List notification templates (Admin)' })
  async listTemplates() {
    return this.templateService.findAll();
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(NOTIFICATION_PERMISSIONS.TEMPLATE_MANAGE)
  @ApiOperation({
    summary: 'Create a notification template (Admin)',
    description: 'New notification copy needs no code — templates are data.',
  })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.templateService.create(dto);
  }

  @Patch('templates/:key')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(NOTIFICATION_PERMISSIONS.TEMPLATE_MANAGE)
  @ApiOperation({ summary: 'Update a notification template (Admin)' })
  async updateTemplate(
    @Param('key') key: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templateService.update(key, dto);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(NOTIFICATION_PERMISSIONS.SEND)
  @ApiOperation({
    summary: 'Send a notification to one user (Admin/Dashboard)',
    description: 'Uses a template or an ad-hoc title/message.',
  })
  async send(@Body() dto: SendNotificationDto) {
    const { userId, templateKey, variables, channels, dedupeKey, ...override } = dto;
    return this.dispatcher.dispatch({
      userId,
      templateKey,
      variables,
      channels,
      dedupeKey,
      override,
    });
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(NOTIFICATION_PERMISSIONS.BROADCAST)
  @ApiOperation({
    summary: 'Send a notification to many users (Admin/Dashboard)',
    description: 'Backs campaign, store and marketing broadcasts.',
  })
  async broadcast(@Body() dto: BroadcastNotificationDto) {
    const { userIds, templateKey, variables, channels, ...override } = dto;

    const results = await Promise.all(
      userIds.map((userId) =>
        this.dispatcher.dispatch({
          userId,
          templateKey,
          variables,
          channels,
          override,
        }),
      ),
    );

    return {
      requested: userIds.length,
      delivered: results.filter((r) => r.delivered).length,
    };
  }

  @Get('channels')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(NOTIFICATION_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({
    summary: 'List registered delivery channels (Admin)',
    description: 'Reflects which channels are live; future ones appear here once registered.',
  })
  async channels() {
    return { channels: this.dispatcher.getRegisteredChannels() };
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(NOTIFICATION_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Notification funnel analytics (Admin)' })
  async analytics() {
    return this.analyticsService.getStats();
  }

  // ─── Per-notification (dynamic segment last) ──────────

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get one of my notifications' })
  async getOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.getById(user.sub, id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark a notification read' })
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.markRead(user.sub, id);
  }

  @Patch(':id/click')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Record a click and mark read',
    description: 'Called when the user follows a notification action.',
  })
  async trackClick(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.trackClick(user.sub, id);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Archive a notification' })
  async archive(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.archive(user.sub, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a notification' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationService.remove(user.sub, id);
    return { message: 'Notification deleted successfully' };
  }
}
