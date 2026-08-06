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
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CurrentUser } from '../../../common/decorators';
import { MenuService } from '../services/menu.service';
import {
  AssignMenuTagsDto,
  CreateMenuCategoryDto,
  CreateMenuItemDto,
  CreateMenuItemImageDto,
  CreateMenuTagDto,
  MenuItemQueryDto,
  MenuSearchDto,
  UpdateMenuCategoryDto,
  UpdateMenuItemDto,
  UpdateMenuTagDto,
} from '../dto';
import { MENU_PERMISSIONS } from '../constants';

// ─── Categories ────────────────────────────────────────────

@ApiTags('Menu Categories')
@Controller({ path: 'menu/categories', version: '1' })
export class MenuCategoryController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'List all menu categories' })
  findAll(@Query('status') status?: any) {
    return this.menuService.findCategories(status);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a menu category by ID or slug' })
  @ApiParam({ name: 'idOrSlug', description: 'UUID or slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.menuService.findCategoryByIdOrSlug(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.CATEGORY_MANAGE)
  @ApiOperation({ summary: 'Create a menu category' })
  create(@Body() dto: CreateMenuCategoryDto, @CurrentUser('id') userId?: string) {
    return this.menuService.createCategory(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.CATEGORY_MANAGE)
  @ApiOperation({ summary: 'Update a menu category' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuCategoryDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.menuService.updateCategory(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.CATEGORY_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a menu category (archives it)' })
  remove(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.menuService.deleteCategory(id, userId);
  }
}

// ─── Items ─────────────────────────────────────────────────

@ApiTags('Menu Items')
@Controller({ path: 'menu/items', version: '1' })
export class MenuItemController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'List menu items with filters and pagination' })
  findAll(@Query() query: MenuItemQueryDto) {
    return this.menuService.findItems(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured menu items' })
  featured() {
    return this.menuService.findFeatured();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search menu items by keywords' })
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.ITEM_CREATE)
  @ApiOperation({ summary: 'Create a menu item' })
  create(@Body() dto: CreateMenuItemDto, @CurrentUser('id') userId?: string) {
    return this.menuService.createItem(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.ITEM_UPDATE)
  @ApiOperation({ summary: 'Update a menu item (SKU is immutable)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.menuService.updateItem(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.ITEM_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a menu item (archives it)' })
  archive(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.menuService.archiveItem(id, userId);
  }

  // ─── Images ──────────────────────────────────────────────

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.IMAGE_MANAGE)
  @ApiOperation({ summary: 'Add an image to a menu item' })
  addImage(@Param('id') id: string, @Body() dto: CreateMenuItemImageDto) {
    return this.menuService.addImage(id, dto);
  }

  @Patch('images/:imageId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.IMAGE_MANAGE)
  @ApiOperation({ summary: 'Replace a menu item image' })
  replaceImage(@Param('imageId') imageId: string, @Body() dto: CreateMenuItemImageDto) {
    return this.menuService.replaceImage(imageId, dto);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.IMAGE_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a menu item image' })
  deleteImage(@Param('imageId') imageId: string) {
    return this.menuService.deleteImage(imageId);
  }
}

// ─── Tags ──────────────────────────────────────────────────

@ApiTags('Menu Tags')
@Controller({ path: 'menu/tags', version: '1' })
export class MenuTagController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'List all menu tags' })
  findAll(@Query('status') status?: any) {
    return this.menuService.findTags(status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.TAG_MANAGE)
  @ApiOperation({ summary: 'Create a menu tag' })
  create(@Body() dto: CreateMenuTagDto) {
    return this.menuService.createTag(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.TAG_MANAGE)
  @ApiOperation({ summary: 'Update a menu tag' })
  update(@Param('id') id: string, @Body() dto: UpdateMenuTagDto) {
    return this.menuService.updateTag(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(MENU_PERMISSIONS.TAG_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a menu tag' })
  remove(@Param('id') id: string) {
    return this.menuService.deleteTag(id);
  }
}
