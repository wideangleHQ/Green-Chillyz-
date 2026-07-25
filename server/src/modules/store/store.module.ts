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
import {
  StoreService,
  StoreTimingService,
  StoreGalleryService,
  StoreManagerService,
  StoreCacheService,
  StoreImageService,
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
  ],
  providers: [
    StoreService,
    StoreTimingService,
    StoreGalleryService,
    StoreManagerService,
    StoreCacheService,
    StoreImageService,
  ],
  exports: [StoreService, StoreCacheService],
})
export class StoreModule {}
