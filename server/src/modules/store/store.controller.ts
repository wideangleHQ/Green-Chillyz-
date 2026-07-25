import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtPayload } from '../auth/interfaces';
import { StoreService } from './services/store.service';
import {
  CreateStoreDto,
  UpdateStoreDto,
  StoreQueryDto,
  NearbyStoreQueryDto,
} from './dto';
import { STORE_PERMISSIONS } from './constants';

@ApiTags('Stores')
@Controller({ path: 'stores', version: '1' })
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Create a new store' })
  async create(
    @Body() dto: CreateStoreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.storeService.create(dto, user.sub);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List stores with filtering and pagination' })
  async findAll(@Query() query: StoreQueryDto) {
    return this.storeService.findAll(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured stores' })
  async findFeatured() {
    return this.storeService.findFeatured();
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Get all active stores' })
  async findActive() {
    return this.storeService.findActive();
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search stores' })
  async search(@Query() query: StoreQueryDto) {
    return this.storeService.search(query);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearest stores by coordinates',
    description:
      'Returns ranked nearby stores with distance, open status, and Google Maps navigation URLs. ' +
      'Stores are ranked by distance, then open status, featured flag, rating, and reviews. ' +
      'Results are cached by rounded coordinates (3 decimal places) for 90 seconds.',
  })
  async findNearby(@Query() query: NearbyStoreQueryDto) {
    return this.storeService.findNearby(query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get store by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.storeService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a store' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.storeService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.DELETE)
  @ApiOperation({ summary: 'Soft delete a store' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.storeService.softDelete(id, user.sub);
    return { message: 'Store deleted successfully' };
  }

  @Public()
  @Get(':id/open-now')
  @ApiOperation({ summary: 'Check if store is currently open' })
  async isOpenNow(@Param('id', ParseUUIDPipe) id: string) {
    const isOpen = await this.storeService.isOpenNow(id);
    return { isOpen };
  }
}
