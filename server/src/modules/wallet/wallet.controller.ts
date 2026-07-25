import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { WalletService } from './services/wallet.service';
import { CreditWalletDto, DebitWalletDto, TransactionQueryDto } from './dto';
import { WALLET_PERMISSIONS } from './constants';

@ApiTags('Wallet')
@Controller({ path: 'wallet', version: '1' })
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user wallet summary' })
  async getMySummary(@CurrentUser() user: JwtPayload) {
    return this.walletService.getSummary(user.sub);
  }

  @Get('me/balance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user wallet balance' })
  async getMyBalance(@CurrentUser() user: JwtPayload) {
    return this.walletService.getBalance(user.sub);
  }

  @Get('me/transactions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user transaction history' })
  async getMyTransactions(
    @CurrentUser() user: JwtPayload,
    @Query() query: TransactionQueryDto,
  ) {
    return this.walletService.getTransactions(user.sub, query);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(WALLET_PERMISSIONS.VIEW_ANY)
  @ApiOperation({ summary: 'Get any user wallet summary (admin)' })
  async getUserSummary(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.walletService.getSummary(userId);
  }

  @Get('user/:userId/transactions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(WALLET_PERMISSIONS.VIEW_ANY)
  @ApiOperation({ summary: 'Get any user transaction history (admin)' })
  async getUserTransactions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.walletService.getTransactions(userId, query);
  }

  @Post('credit')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(WALLET_PERMISSIONS.CREDIT)
  @ApiOperation({ summary: 'Credit coins to a user wallet (admin)' })
  async credit(
    @Body() dto: CreditWalletDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.walletService.credit(
      dto,
      user.sub,
      req.ip,
      req.headers['user-agent'] as string,
    );
  }

  @Post('debit')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(WALLET_PERMISSIONS.DEBIT)
  @ApiOperation({ summary: 'Debit coins from a user wallet (admin)' })
  async debit(
    @Body() dto: DebitWalletDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.walletService.debit(
      dto,
      user.sub,
      req.ip,
      req.headers['user-agent'] as string,
    );
  }

  @Post('expire')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(WALLET_PERMISSIONS.ADJUST)
  @ApiOperation({ summary: 'Run coin expiration (admin/cron)' })
  async expireCoins() {
    const count = await this.walletService.expireCoins();
    return { expiredCount: count };
  }
}
