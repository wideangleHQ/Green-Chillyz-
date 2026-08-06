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
import { TransactionQueryDto } from '../../wallet/dto';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { DashboardWalletService } from './dashboard-wallet.service';
import { DashboardWalletQueryDto } from './dto/dashboard-wallet.dto';

@ApiTags('Dashboard Wallets')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/wallets', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardWalletController {
  constructor(private readonly walletService: DashboardWalletService) {}

  @Get()
  @ApiOperation({
    summary: 'List wallets of the store’s customers',
    description: 'Searchable, sortable, paginated wallet roster.',
  })
  @ApiOkResponse({ description: 'Paginated wallet list' })
  async list(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: DashboardWalletQueryDto,
  ) {
    return this.walletService.list(storeId, query);
  }

  @Get(':customerId')
  @ApiOperation({
    summary: 'Wallet summary for one customer',
    description:
      'Balance, pending balance and lifetime earned / spent / expired, ' +
      'computed by the shared WalletService.',
  })
  @ApiNotFoundResponse({ description: 'Customer not assigned to this store' })
  async getSummary(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.walletService.getSummary(storeId, customerId);
  }

  @Get(':customerId/transactions')
  @ApiOperation({
    summary: 'Wallet ledger for one customer',
    description:
      'Paginated transaction history with type, source, status and date filters.',
  })
  @ApiNotFoundResponse({ description: 'Customer not assigned to this store' })
  async getTransactions(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.walletService.getTransactions(storeId, customerId, query);
  }
}
