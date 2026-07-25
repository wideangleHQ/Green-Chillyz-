import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { StoreGalleryService } from './services/store-gallery.service';
import { UpdateStoreGalleryDto } from './dto';
import { STORE_PERMISSIONS } from './constants';

@ApiTags('Store Gallery & Images')
@Controller({ path: 'stores/:storeId/gallery', version: '1' })
export class StoreGalleryController {
  constructor(private readonly galleryService: StoreGalleryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a gallery image' })
  async uploadImage(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('alt') alt?: string,
  ) {
    return this.galleryService.uploadGalleryImage(storeId, file, alt);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get store gallery' })
  async getGallery(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.galleryService.getGallery(storeId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update gallery item (alt text, display order)' })
  async updateItem(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreGalleryDto,
  ) {
    return this.galleryService.updateGalleryItem(storeId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Delete a gallery image' })
  async deleteItem(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.galleryService.deleteGalleryItem(storeId, id);
    return { message: 'Gallery image deleted successfully' };
  }
}

@ApiTags('Store Gallery & Images')
@Controller({ path: 'stores/:storeId/images', version: '1' })
export class StoreImageController {
  constructor(private readonly galleryService: StoreGalleryService) {}

  @Post(':type')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload store image (thumbnail, cover, or logo)' })
  async uploadImage(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('type') type: 'thumbnail' | 'cover' | 'logo',
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.galleryService.uploadStoreImage(storeId, file, type);
    return { url };
  }

  @Delete(':type')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Delete store image (thumbnail, cover, or logo)' })
  async deleteImage(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('type') type: 'thumbnail' | 'cover' | 'logo',
  ) {
    await this.galleryService.deleteStoreImage(storeId, type);
    return { message: 'Image deleted successfully' };
  }
}
