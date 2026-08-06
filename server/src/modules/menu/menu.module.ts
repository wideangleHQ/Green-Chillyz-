import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  MenuImportController,
  MenuCategoryController,
  MenuItemController,
  MenuTagController,
} from './controllers';
import { MenuCacheService } from './cache';
import { MenuRepository } from './repositories';
import { MenuImportService, MenuService } from './services';
import { MenuListener } from './listeners';

@Module({
  imports: [AuthModule],
  controllers: [
    MenuImportController,
    MenuCategoryController,
    MenuItemController,
    MenuTagController,
  ],
  providers: [
    MenuRepository,
    MenuCacheService,
    MenuImportService,
    MenuService,
    MenuListener,
  ],
  exports: [MenuService, MenuImportService, MenuRepository, MenuCacheService],
})
export class MenuModule {}
