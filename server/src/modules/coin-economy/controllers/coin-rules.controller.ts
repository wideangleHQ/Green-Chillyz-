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
import { CoinRuleService } from '../services';
import {
  CoinRuleQueryDto,
  CreateCoinRuleDto,
  DuplicateCoinRuleDto,
  UpdateCoinRuleDto,
} from '../dto';
import { COIN_ECONOMY_PERMISSIONS } from '../constants';

@ApiTags('Coin Rules')
@Controller({ path: 'coin-rules', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CoinRulesController {
  constructor(private readonly service: CoinRuleService) {}

  @Get()
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_VIEW)
  @ApiOperation({ summary: 'List coin rules with filters and pagination' })
  findAll(@Query() query: CoinRuleQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_VIEW)
  @ApiParam({ name: 'id', description: 'Coin rule UUID' })
  @ApiOperation({ summary: 'Get a coin rule by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Get(':id/history')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_VIEW)
  @ApiOperation({ summary: 'Get the change history of a coin rule' })
  findHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findHistory(id);
  }

  @Get(':id/metadata')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_VIEW)
  @ApiOperation({ summary: 'Get the metadata of a coin rule' })
  findMetadata(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findMetadata(id);
  }

  @Post()
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_CREATE)
  @ApiOperation({ summary: 'Create a coin rule' })
  create(@Body() dto: CreateCoinRuleDto, @CurrentUser('id') userId?: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_UPDATE)
  @ApiOperation({ summary: 'Update a coin rule' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCoinRuleDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Post(':id/enable')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_UPDATE)
  @ApiOperation({ summary: 'Enable a coin rule' })
  enable(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId?: string) {
    return this.service.setEnabled(id, true, userId);
  }

  @Post(':id/disable')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_UPDATE)
  @ApiOperation({ summary: 'Disable a coin rule' })
  disable(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.setEnabled(id, false, userId);
  }

  @Post(':id/duplicate')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_CREATE)
  @ApiOperation({ summary: 'Duplicate a coin rule as a draft' })
  duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicateCoinRuleDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.duplicate(id, dto, userId);
  }

  @Post(':id/restore')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_UPDATE)
  @ApiOperation({ summary: 'Restore an archived coin rule as a draft' })
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.restore(id, userId);
  }

  @Delete(':id')
  @Permissions(COIN_ECONOMY_PERMISSIONS.RULE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a coin rule (soft delete)' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ): Promise<void> {
    await this.service.archive(id, userId);
  }
}
