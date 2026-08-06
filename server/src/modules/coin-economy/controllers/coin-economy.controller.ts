import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { CoinEconomyService } from '../services';
import { CustomerCoinQueryDto, EarnCoinsDto, PreviewCoinsDto } from '../dto';

/**
 * Customer-facing surface. Reads describe what the configured rules are worth
 * to this customer right now; the earn endpoint runs the full pipeline.
 */
@ApiTags('Coin Economy')
@Controller({ path: 'coin-economy', version: '1' })
@UseGuards(JwtAuthGuard)
export class CoinEconomyController {
  constructor(private readonly service: CoinEconomyService) {}

  @Get('rules')
  @ApiOperation({ summary: 'Current coin rules with availability for the customer' })
  getRules(
    @CurrentUser('id') userId: string,
    @Query() query: CustomerCoinQueryDto,
  ) {
    return this.service.getCustomerRules(userId, query.storeId ?? null);
  }

  @Get('game-rules')
  @ApiOperation({ summary: 'Coin rules backing the games' })
  getGameRules(
    @CurrentUser('id') userId: string,
    @Query() query: CustomerCoinQueryDto,
  ) {
    return this.service.getCustomerGameRules(userId, query.storeId ?? null);
  }

  @Get('daily-limits')
  @ApiOperation({ summary: 'Per-rule limits and how much of each is used' })
  getDailyLimits(@CurrentUser('id') userId: string) {
    return this.service.getCustomerDailyLimits(userId);
  }

  @Get('available-bonuses')
  @ApiOperation({ summary: 'Bonuses the customer can claim right now' })
  getAvailableBonuses(
    @CurrentUser('id') userId: string,
    @Query() query: CustomerCoinQueryDto,
  ) {
    return this.service.getAvailableBonuses(userId, query.storeId ?? null);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Resolve a coin decision without crediting' })
  preview(@CurrentUser('id') userId: string, @Body() dto: PreviewCoinsDto) {
    return this.service.preview({ userId, ...dto });
  }

  @Post('earn')
  @ApiOperation({ summary: 'Earn coins for a customer action' })
  earn(
    @CurrentUser('id') userId: string,
    @Body() dto: EarnCoinsDto,
    @Req() req: Request,
  ) {
    return this.service.earn({
      userId,
      ...dto,
      ip: req.ip ?? null,
      device: req.headers['user-agent'] ?? null,
    });
  }
}
