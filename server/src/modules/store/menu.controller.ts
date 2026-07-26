import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { MenuService, Dish } from './services/menu.service';
import { MenuQueryDto } from './dto/menu-query.dto';

@ApiTags('Store Menus')
@Controller({ path: 'stores/:storeId', version: '1' })
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Public()
  @Get('menu')
  @ApiOperation({ summary: 'Get menu items for a specific store outlet' })
  async getMenu(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: MenuQueryDto,
  ): Promise<Dish[]> {
    return this.menuService.getStoreMenu(storeId, query);
  }

  @Public()
  @Get('menu/featured')
  @ApiOperation({ summary: 'Get premium featured dishes for a specific store outlet' })
  async getFeatured(
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ): Promise<Dish[]> {
    return this.menuService.getFeaturedDishes(storeId);
  }
}
