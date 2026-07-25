import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCacheService } from './store-cache.service';
import { StoreImageService } from './store-image.service';
import { UpdateStoreGalleryDto } from '../dto';
import { StoreGalleryResponse } from '../interfaces';
import { STORE_ERRORS, MAX_GALLERY_IMAGES } from '../constants';

@Injectable()
export class StoreGalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: StoreCacheService,
    private readonly imageService: StoreImageService,
  ) {}

  async uploadGalleryImage(
    storeId: string,
    file: Express.Multer.File,
    alt?: string,
  ): Promise<StoreGalleryResponse> {
    await this.ensureStoreExists(storeId);

    const count = await this.prisma.storeGallery.count({ where: { storeId } });
    if (count >= MAX_GALLERY_IMAGES) {
      throw new BadRequestException(
        `Maximum ${MAX_GALLERY_IMAGES} gallery images allowed`,
      );
    }

    const imageUrl = await this.imageService.uploadImage(
      storeId,
      file,
      'gallery',
    );

    const maxOrder = await this.prisma.storeGallery.aggregate({
      where: { storeId },
      _max: { displayOrder: true },
    });

    const gallery = await this.prisma.storeGallery.create({
      data: {
        storeId,
        image: imageUrl,
        alt: alt ?? null,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });

    await this.cache.invalidateStore(storeId);

    return {
      id: gallery.id,
      image: gallery.image,
      alt: gallery.alt,
      displayOrder: gallery.displayOrder,
      createdAt: gallery.createdAt,
    };
  }

  async getGallery(storeId: string): Promise<StoreGalleryResponse[]> {
    await this.ensureStoreExists(storeId);

    const items = await this.prisma.storeGallery.findMany({
      where: { storeId },
      orderBy: { displayOrder: 'asc' },
    });

    return items.map((g) => ({
      id: g.id,
      image: g.image,
      alt: g.alt,
      displayOrder: g.displayOrder,
      createdAt: g.createdAt,
    }));
  }

  async updateGalleryItem(
    storeId: string,
    galleryId: string,
    dto: UpdateStoreGalleryDto,
  ): Promise<StoreGalleryResponse> {
    const item = await this.prisma.storeGallery.findFirst({
      where: { id: galleryId, storeId },
    });

    if (!item) {
      throw new NotFoundException(STORE_ERRORS.GALLERY_NOT_FOUND);
    }

    const updated = await this.prisma.storeGallery.update({
      where: { id: galleryId },
      data: dto,
    });

    await this.cache.invalidateStore(storeId);

    return {
      id: updated.id,
      image: updated.image,
      alt: updated.alt,
      displayOrder: updated.displayOrder,
      createdAt: updated.createdAt,
    };
  }

  async deleteGalleryItem(
    storeId: string,
    galleryId: string,
  ): Promise<void> {
    const item = await this.prisma.storeGallery.findFirst({
      where: { id: galleryId, storeId },
    });

    if (!item) {
      throw new NotFoundException(STORE_ERRORS.GALLERY_NOT_FOUND);
    }

    await this.prisma.storeGallery.delete({ where: { id: galleryId } });
    await this.imageService.deleteImage(item.image);
    await this.cache.invalidateStore(storeId);
  }

  async uploadStoreImage(
    storeId: string,
    file: Express.Multer.File,
    type: 'thumbnail' | 'cover' | 'logo',
  ): Promise<string> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { id: true, thumbnailImage: true, coverImage: true, logo: true },
    });

    if (!store) {
      throw new NotFoundException(STORE_ERRORS.NOT_FOUND);
    }

    const fieldMap = {
      thumbnail: 'thumbnailImage',
      cover: 'coverImage',
      logo: 'logo',
    } as const;

    const field = fieldMap[type];
    const oldImage = store[field];

    const newUrl = await this.imageService.replaceImage(
      storeId,
      oldImage,
      file,
      type,
    );

    await this.prisma.store.update({
      where: { id: storeId },
      data: { [field]: newUrl },
    });

    await this.cache.invalidateStore(storeId);

    return newUrl;
  }

  async deleteStoreImage(
    storeId: string,
    type: 'thumbnail' | 'cover' | 'logo',
  ): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { id: true, thumbnailImage: true, coverImage: true, logo: true },
    });

    if (!store) {
      throw new NotFoundException(STORE_ERRORS.NOT_FOUND);
    }

    const fieldMap = {
      thumbnail: 'thumbnailImage',
      cover: 'coverImage',
      logo: 'logo',
    } as const;

    const field = fieldMap[type];
    const imageUrl = store[field];

    if (imageUrl) {
      await this.imageService.deleteImage(imageUrl);
      await this.prisma.store.update({
        where: { id: storeId },
        data: { [field]: null },
      });
      await this.cache.invalidateStore(storeId);
    }
  }

  private async ensureStoreExists(storeId: string): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException(STORE_ERRORS.NOT_FOUND);
    }
  }
}
