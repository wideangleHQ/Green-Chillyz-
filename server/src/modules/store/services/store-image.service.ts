import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StorageService } from '../../../providers/storage/storage.service';
import { STORE_IMAGE_PATHS, STORE_ERRORS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StoreImageService {
  private readonly logger = new Logger(StoreImageService.name);

  constructor(private readonly storageService: StorageService) {}

  async uploadImage(
    storeId: string,
    file: Express.Multer.File,
    type: 'thumbnail' | 'cover' | 'logo' | 'gallery',
  ): Promise<string> {
    this.validateImage(file);
    const ext = this.getExtension(file.originalname);
    const pathMap = {
      thumbnail: STORE_IMAGE_PATHS.THUMBNAIL,
      cover: STORE_IMAGE_PATHS.COVER,
      logo: STORE_IMAGE_PATHS.LOGO,
      gallery: STORE_IMAGE_PATHS.GALLERY,
    };
    const key = `${pathMap[type]}/${storeId}/${uuidv4()}${ext}`;

    try {
      return await this.storageService.upload(key, file.buffer, file.mimetype);
    } catch (error) {
      this.logger.error(`Image upload failed for store ${storeId}`, error);
      throw new BadRequestException(STORE_ERRORS.IMAGE_UPLOAD_FAILED);
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(imageUrl);
    if (!key) return;

    try {
      await this.storageService.delete(key);
    } catch (error) {
      this.logger.warn(`Failed to delete image: ${key}`, error);
    }
  }

  async replaceImage(
    storeId: string,
    oldImageUrl: string | null,
    file: Express.Multer.File,
    type: 'thumbnail' | 'cover' | 'logo' | 'gallery',
  ): Promise<string> {
    const newUrl = await this.uploadImage(storeId, file, type);

    if (oldImageUrl) {
      await this.deleteImage(oldImageUrl);
    }

    return newUrl;
  }

  private validateImage(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and AVIF images are allowed');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Image size must not exceed 5MB');
    }
  }

  private getExtension(filename: string): string {
    const ext = filename.lastIndexOf('.') !== -1
      ? filename.substring(filename.lastIndexOf('.'))
      : '.jpg';
    return ext.toLowerCase();
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.pathname.startsWith('/')
        ? parsedUrl.pathname.substring(1)
        : parsedUrl.pathname;
    } catch {
      return null;
    }
  }
}
