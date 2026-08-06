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
import { CoinMultiplierService } from '../services';
import {
  CoinMultiplierQueryDto,
  CreateCoinMultiplierDto,
  UpdateCoinMultiplierDto,
} from '../dto';
import { COIN_ECONOMY_PERMISSIONS } from '../constants';

@ApiTags('Coin Multipliers')
@Controller({ path: 'coin-multipliers', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CoinMultipliersController {
  constructor(private readonly service: CoinMultiplierService) {}

  @Get()
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_VIEW)
  @ApiOperation({ summary: 'List coin multipliers' })
  findAll(@Query() query: CoinMultiplierQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_VIEW)
  @ApiParam({ name: 'id', description: 'Coin multiplier UUID' })
  @ApiOperation({ summary: 'Get a coin multiplier by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Permissions(COIN_ECONOMY_PERMISSIONS.MULTIPLIER_MANAGE)
  @ApiOperation({ summary: 'Create a coin multiplier' })
  create(@Body() dto: CreateCoinMultiplierDto, @CurrentUser('id') userId?: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @Permissions(COIN_ECONOMY_PERMISSIONS.MULTIPLIER_MANAGE)
  @ApiOperation({ summary: 'Update a coin multiplier' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCoinMultiplierDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Post(':id/restore')
  @Permissions(COIN_ECONOMY_PERMISSIONS.MULTIPLIER_MANAGE)
  @ApiOperation({ summary: 'Restore an archived coin multiplier' })
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.restore(id, userId);
  }

  @Delete(':id')
  @Permissions(COIN_ECONOMY_PERMISSIONS.MULTIPLIER_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a coin multiplier (soft delete)' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ): Promise<void> {
    await this.service.archive(id, userId);
  }
}
