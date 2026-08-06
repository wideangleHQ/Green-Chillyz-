import {
  Body,
  Controller,
  Delete,
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
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CoinLimitService } from '../services';
import { CoinLimitQueryDto, CreateCoinLimitDto, UpdateCoinLimitDto } from '../dto';
import { COIN_ECONOMY_PERMISSIONS } from '../constants';

@ApiTags('Coin Limits')
@Controller({ path: 'coin-limits', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CoinLimitsController {
  constructor(private readonly service: CoinLimitService) {}

  @Get()
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_VIEW)
  @ApiOperation({ summary: 'List coin limits' })
  findAll(@Query() query: CoinLimitQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_VIEW)
  @ApiParam({ name: 'id', description: 'Coin limit UUID' })
  @ApiOperation({ summary: 'Get a coin limit by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Permissions(COIN_ECONOMY_PERMISSIONS.LIMIT_MANAGE)
  @ApiOperation({ summary: 'Create a coin limit' })
  create(@Body() dto: CreateCoinLimitDto, @CurrentUser('id') userId?: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @Permissions(COIN_ECONOMY_PERMISSIONS.LIMIT_MANAGE)
  @ApiOperation({ summary: 'Update a coin limit' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCoinLimitDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Post(':id/restore')
  @Permissions(COIN_ECONOMY_PERMISSIONS.LIMIT_MANAGE)
  @ApiOperation({ summary: 'Restore an archived coin limit' })
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.restore(id, userId);
  }

  @Delete(':id')
  @Permissions(COIN_ECONOMY_PERMISSIONS.LIMIT_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a coin limit (soft delete)' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ): Promise<void> {
    await this.service.archive(id, userId);
  }
}
