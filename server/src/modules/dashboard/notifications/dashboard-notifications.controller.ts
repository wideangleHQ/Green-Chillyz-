import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { DashboardNotificationsService } from './dashboard-notifications.service';
import { DashboardNotificationQueryDto } from './dto/dashboard-notification.dto';

@ApiTags('Dashboard Notifications')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/notifications', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardNotificationsController {
  constructor(
    private readonly notificationsService: DashboardNotificationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Recent notifications across the store’s customers',
  })
  @ApiOkResponse({ description: 'Paginated notification list' })
  async list(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: DashboardNotificationQueryDto,
  ) {
    return this.notificationsService.list(storeId, query);
  }

  @Get('unread')
  @ApiOperation({
    summary: 'Unread notification count across the store’s customers',
  })
  @ApiOkResponse({ description: '{ unread: number }' })
  async getUnreadCount(@DashboardCurrentStore('storeId') storeId: string) {
    return this.notificationsService.getUnreadCount(storeId);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Notification history with type, status and date filters',
  })
  async history(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: DashboardNotificationQueryDto,
  ) {
    return this.notificationsService.list(storeId, query);
  }
}
