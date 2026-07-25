import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { StoreTimingService } from './services/store-timing.service';
import {
  BulkStoreTimingDto,
  UpdateStoreTimingDto,
  CreateStoreHolidayDto,
  UpdateStoreHolidayDto,
} from './dto';
import { STORE_PERMISSIONS } from './constants';

@ApiTags('Store Timings & Holidays')
@Controller({ path: 'stores/:storeId/timings', version: '1' })
export class StoreTimingController {
  constructor(private readonly timingService: StoreTimingService) {}

  @Put()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Set store timings (bulk upsert all days)' })
  async setTimings(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: BulkStoreTimingDto,
  ) {
    return this.timingService.setTimings(storeId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get store timings' })
  async getTimings(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.timingService.getTimings(storeId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a single timing entry' })
  async updateTiming(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreTimingDto,
  ) {
    return this.timingService.updateTiming(storeId, id, dto);
  }
}

@ApiTags('Store Timings & Holidays')
@Controller({ path: 'stores/:storeId/holidays', version: '1' })
export class StoreHolidayController {
  constructor(private readonly timingService: StoreTimingService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Add a store holiday' })
  async createHoliday(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateStoreHolidayDto,
  ) {
    return this.timingService.createHoliday(storeId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List store holidays' })
  async getHolidays(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.timingService.getHolidays(storeId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a holiday' })
  async updateHoliday(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreHolidayDto,
  ) {
    return this.timingService.updateHoliday(storeId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Delete a holiday' })
  async deleteHoliday(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.timingService.deleteHoliday(storeId, id);
    return { message: 'Holiday deleted successfully' };
  }
}
