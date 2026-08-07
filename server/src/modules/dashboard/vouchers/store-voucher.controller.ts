import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { StoreVoucherManagementService } from './store-voucher.service';
import {
  CreateStoreVoucherDto,
  UpdateStoreVoucherDto,
  StoreVoucherQueryDto,
  RedeemStoreVoucherDto,
} from './dto/store-voucher.dto';

@ApiTags('Dashboard Store Vouchers')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/store-vouchers', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class StoreVoucherController {
  constructor(
    private readonly storeVoucherService: StoreVoucherManagementService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new store voucher' })
  async create(
    @DashboardCurrentStore('storeId') storeId: string,
    @Body() dto: CreateStoreVoucherDto,
  ) {
    return this.storeVoucherService.create(storeId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List store vouchers with filters' })
  @ApiOkResponse({ description: 'Paginated store voucher list' })
  async list(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: StoreVoucherQueryDto,
  ) {
    return this.storeVoucherService.list(storeId, query);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Voucher analytics for this store' })
  async analytics(@DashboardCurrentStore('storeId') storeId: string) {
    return this.storeVoucherService.getAnalytics(storeId);
  }

  @Get('customer-facing')
  @ApiOperation({ summary: 'Vouchers visible to customers' })
  async customerFacing(@DashboardCurrentStore('storeId') storeId: string) {
    return this.storeVoucherService.getCustomerVouchers(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get voucher detail with recent history' })
  async getDetail(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storeVoucherService.getDetail(storeId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a store voucher' })
  async update(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreVoucherDto,
  ) {
    return this.storeVoucherService.update(storeId, id, dto);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a voucher' })
  async archive(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storeVoucherService.archive(storeId, id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore an archived voucher to DRAFT' })
  async restore(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storeVoucherService.restore(storeId, id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a voucher' })
  async activate(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storeVoucherService.activate(storeId, id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an active voucher' })
  async deactivate(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storeVoucherService.deactivate(storeId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a voucher as a new DRAFT' })
  async duplicate(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storeVoucherService.duplicate(storeId, id);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a store voucher by coupon code' })
  async redeem(
    @DashboardCurrentStore('storeId') storeId: string,
    @Body() dto: RedeemStoreVoucherDto,
  ) {
    return this.storeVoucherService.redeem(storeId, dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Voucher change history' })
  async history(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: StoreVoucherQueryDto,
  ) {
    return this.storeVoucherService.getHistory(storeId, id, query);
  }
}
