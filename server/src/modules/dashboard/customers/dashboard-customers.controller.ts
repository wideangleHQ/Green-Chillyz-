import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { NotificationQueryDto } from '../../notification/dto';
import { VoucherQueryDto } from '../../rewards/dto';
import { GameSessionQueryDto } from '../../game/dto';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { DashboardCustomersService } from './dashboard-customers.service';
import {
  DashboardActivityQueryDto,
  DashboardCustomerQueryDto,
} from './dto/dashboard-customer.dto';

/**
 * Store-scoped customer operations. Every read is confined to customers
 * assigned to the authenticated store; other customers resolve to 404.
 */
@ApiTags('Dashboard Customers')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/customers', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardCustomersController {
  constructor(private readonly customersService: DashboardCustomersService) {}

  @Get()
  @ApiOperation({
    summary: 'Search the store’s customers',
    description:
      'Free-text search across name, email, username, phone, customer id and ' +
      'voucher code, with pagination and sorting. Results are limited to ' +
      'customers assigned to the authenticated store.',
  })
  @ApiOkResponse({ description: 'Paginated customer list with wallet summary' })
  async search(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: DashboardCustomerQueryDto,
  ) {
    return this.customersService.search(storeId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Customer profile with wallet and activity counts' })
  @ApiNotFoundResponse({ description: 'Customer not assigned to this store' })
  async getProfile(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) customerId: string,
  ) {
    return this.customersService.getProfile(storeId, customerId);
  }

  @Get(':id/wallet')
  @ApiOperation({ summary: 'Customer wallet summary' })
  @ApiNotFoundResponse({ description: 'Customer not assigned to this store' })
  async getWallet(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) customerId: string,
  ) {
    return this.customersService.getWallet(storeId, customerId);
  }

  @Get(':id/rewards')
  @ApiOperation({ summary: 'Customer reward redemptions' })
  @ApiNotFoundResponse({ description: 'Customer not assigned to this store' })
  async getRewards(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) customerId: string,
    @Query() query: VoucherQueryDto,
  ) {
    return this.customersService.getRewards(storeId, customerId, query);
  }

  @Get(':id/games')
  @ApiOperation({ summary: 'Customer game sessions' })
  @ApiNotFoundResponse({ description: 'Customer not assigned to this store' })
  async getGames(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) customerId: string,
    @Query() query: GameSessionQueryDto,
  ) {
    return this.customersService.getGames(storeId, customerId, query);
  }

  @Get(':id/notifications')
  @ApiOperation({ summary: 'Customer notifications' })
  @ApiNotFoundResponse({ description: 'Customer not assigned to this store' })
  async getNotifications(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) customerId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.customersService.getNotifications(storeId, customerId, query);
  }

  @Get(':id/activity')
  @ApiOperation({
    summary: 'Customer activity timeline',
    description:
      'Chronological merge of wallet movements, redemptions, game sessions ' +
      'and notifications.',
  })
  @ApiNotFoundResponse({ description: 'Customer not assigned to this store' })
  async getActivity(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) customerId: string,
    @Query() query: DashboardActivityQueryDto,
  ) {
    return this.customersService.getActivity(storeId, customerId, query);
  }
}
