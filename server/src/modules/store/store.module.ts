import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { StorageModule } from '../../providers/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { StoreController } from './store.controller';
import {
  StoreTimingController,
  StoreHolidayController,
} from './store-timing.controller';
import {
  StoreGalleryController,
  StoreImageController,
} from './store-gallery.controller';
import {
  StoreManagerController,
  StoreFacilityController,
  StoreAnnouncementController,
} from './store-manager.controller';
import { MenuController } from './menu.controller';
import {
  StoreService,
  StoreTimingService,
  StoreGalleryService,
  StoreManagerService,
  StoreCacheService,
  StoreImageService,
  MenuService,
} from './services';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    MulterModule.register({ storage: require('multer').memoryStorage() }),
  ],
  controllers: [
    StoreController,
    StoreTimingController,
    StoreHolidayController,
    StoreGalleryController,
    StoreImageController,
    StoreManagerController,
    StoreFacilityController,
    StoreAnnouncementController,
    MenuController,
  ],
  providers: [
    StoreService,
    StoreTimingService,
    StoreGalleryService,
    StoreManagerService,
    StoreCacheService,
    StoreImageService,
    MenuService,
  ],
  exports: [StoreService, StoreCacheService, MenuService],
})
export class StoreModule {}
