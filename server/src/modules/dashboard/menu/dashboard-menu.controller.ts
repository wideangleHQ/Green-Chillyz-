import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { MenuService } from '../../menu/services/menu.service';
import {
  CreateMenuItemDto,
  MenuItemQueryDto,
  MenuSearchDto,
  UpdateMenuItemDto,
} from '../../menu/dto';

@ApiTags('Dashboard Menu')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/menu/items', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardMenuItemsController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'List menu items for dashboard management' })
  findAll(@Query() query: MenuItemQueryDto) {
    return this.menuService.findItems(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search menu items' })
  search(@Query() dto: MenuSearchDto) {
    return this.menuService.search(dto);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a menu item by ID or slug' })
  @ApiParam({ name: 'idOrSlug', description: 'UUID or slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.menuService.findItemByIdOrSlug(idOrSlug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a menu item' })
  create(
    @Body() dto: CreateMenuItemDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.menuService.createItem(dto, storeId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a menu item' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.menuService.updateItem(id, dto, storeId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a menu item' })
  archive(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.menuService.archiveItem(id, storeId);
  }
}

@ApiTags('Dashboard Menu Categories')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/menu/categories', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardMenuCategoriesController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'List menu categories for dashboard' })
  findAll(@Query('status') status?: any) {
    return this.menuService.findCategories(status);
  }
}
