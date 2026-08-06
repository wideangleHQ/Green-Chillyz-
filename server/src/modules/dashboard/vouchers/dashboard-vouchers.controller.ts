import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { DashboardVouchersService } from './dashboard-vouchers.service';
import {
  DashboardRedeemVoucherDto,
  DashboardVoucherQueryDto,
} from './dto/dashboard-voucher.dto';

@ApiTags('Dashboard Vouchers')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/vouchers', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardVouchersController {
  constructor(private readonly vouchersService: DashboardVouchersService) {}

  @Get()
  @ApiOperation({
    summary: 'Voucher lookup for this store',
    description:
      'Vouchers issued at this store or held by its customers, filterable by ' +
      'status and exact code.',
  })
  @ApiOkResponse({ description: 'Paginated voucher list' })
  async list(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: DashboardVoucherQueryDto,
  ) {
    return this.vouchersService.list(storeId, query);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Redemption history at this store',
    description: 'Vouchers redeemed at this store, most recent first.',
  })
  async history(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: DashboardVoucherQueryDto,
  ) {
    return this.vouchersService.history(storeId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Voucher detail' })
  @ApiNotFoundResponse({ description: 'Voucher not visible to this store' })
  async getDetail(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) voucherId: string,
  ) {
    return this.vouchersService.getDetail(storeId, voucherId);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redeem a scanned voucher at this store',
    description:
      'Validates the code and signature and marks the voucher used. The ' +
      'redeeming store is always the authenticated store. Invalid, expired ' +
      'or already-used vouchers return `valid: false` with the reason.',
  })
  @ApiOkResponse({ description: 'Verification result with voucher summary' })
  async redeem(
    @DashboardCurrentStore('storeId') storeId: string,
    @Body() dto: DashboardRedeemVoucherDto,
  ) {
    return this.vouchersService.redeem(storeId, dto);
  }
}
