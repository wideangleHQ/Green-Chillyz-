import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StoreGalleryService } from './store-gallery.service';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCacheService } from './store-cache.service';
import { StoreImageService } from './store-image.service';
import { MAX_GALLERY_IMAGES } from '../constants';

function mockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

describe('StoreGalleryService', () => {
  let service: StoreGalleryService;
  let prisma: any;
  let cache: { invalidateStore: ReturnType<typeof vi.fn> };
  let imageService: {
    uploadImage: ReturnType<typeof vi.fn>;
    deleteImage: ReturnType<typeof vi.fn>;
    replaceImage: ReturnType<typeof vi.fn>;
  };

  const storeId = 'store-uuid';

  beforeEach(() => {
    prisma = {
      store: { findFirst: vi.fn(), update: vi.fn() },
      storeGallery: {
        count: vi.fn(),
        aggregate: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    cache = { invalidateStore: vi.fn() };
    imageService = {
      uploadImage: vi.fn().mockResolvedValue('https://cdn.example.com/gallery/img.jpg'),
      deleteImage: vi.fn().mockResolvedValue(undefined),
      replaceImage: vi.fn().mockResolvedValue('https://cdn.example.com/new.jpg'),
    };
    service = new StoreGalleryService(
      prisma as unknown as PrismaService,
      cache as unknown as StoreCacheService,
      imageService as unknown as StoreImageService,
    );
  });

  function mockStoreExists(exists = true) {
    prisma.store.findFirst.mockResolvedValue(exists ? { id: storeId } : null);
  }

  describe('uploadGalleryImage', () => {
    it('should upload and create gallery entry', async () => {
      mockStoreExists();
      prisma.storeGallery.count.mockResolvedValue(0);
      prisma.storeGallery.aggregate.mockResolvedValue({ _max: { displayOrder: null } });
      prisma.storeGallery.create.mockResolvedValue({
        id: 'g-1',
        image: 'https://cdn.example.com/gallery/img.jpg',
        alt: 'Test alt',
        displayOrder: 0,
        createdAt: new Date(),
      });

      const result = await service.uploadGalleryImage(storeId, mockFile(), 'Test alt');

      expect(imageService.uploadImage).toHaveBeenCalledWith(storeId, expect.any(Object), 'gallery');
      expect(result.id).toBe('g-1');
      expect(result.displayOrder).toBe(0);
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should auto-increment display order', async () => {
      mockStoreExists();
      prisma.storeGallery.count.mockResolvedValue(3);
      prisma.storeGallery.aggregate.mockResolvedValue({ _max: { displayOrder: 2 } });
      prisma.storeGallery.create.mockResolvedValue({
        id: 'g-4',
        image: 'url',
        alt: null,
        displayOrder: 3,
        createdAt: new Date(),
      });

      const result = await service.uploadGalleryImage(storeId, mockFile());
      expect(prisma.storeGallery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ displayOrder: 3 }),
        }),
      );
      expect(result.displayOrder).toBe(3);
    });

    it('should reject when at max gallery images', async () => {
      mockStoreExists();
      prisma.storeGallery.count.mockResolvedValue(MAX_GALLERY_IMAGES);

      await expect(
        service.uploadGalleryImage(storeId, mockFile()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when store missing', async () => {
      mockStoreExists(false);
      await expect(
        service.uploadGalleryImage(storeId, mockFile()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGallery', () => {
    it('should return gallery items ordered by displayOrder', async () => {
      mockStoreExists();
      const items = [
        { id: 'g-1', image: 'url1', alt: 'A', displayOrder: 0, createdAt: new Date() },
        { id: 'g-2', image: 'url2', alt: null, displayOrder: 1, createdAt: new Date() },
      ];
      prisma.storeGallery.findMany.mockResolvedValue(items);

      const result = await service.getGallery(storeId);
      expect(result).toHaveLength(2);
      expect(result[0].displayOrder).toBe(0);
    });
  });

  describe('updateGalleryItem', () => {
    it('should update alt and displayOrder', async () => {
      prisma.storeGallery.findFirst.mockResolvedValue({ id: 'g-1', storeId });
      prisma.storeGallery.update.mockResolvedValue({
        id: 'g-1',
        image: 'url',
        alt: 'Updated',
        displayOrder: 5,
        createdAt: new Date(),
      });

      const result = await service.updateGalleryItem(storeId, 'g-1', {
        alt: 'Updated',
        displayOrder: 5,
      });

      expect(result.alt).toBe('Updated');
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should throw NotFoundException when item missing', async () => {
      prisma.storeGallery.findFirst.mockResolvedValue(null);
      await expect(
        service.updateGalleryItem(storeId, 'bad', { alt: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteGalleryItem', () => {
    it('should delete gallery item and cleanup image', async () => {
      prisma.storeGallery.findFirst.mockResolvedValue({
        id: 'g-1',
        storeId,
        image: 'https://cdn.example.com/img.jpg',
      });
      prisma.storeGallery.delete.mockResolvedValue({ id: 'g-1' });

      await service.deleteGalleryItem(storeId, 'g-1');

      expect(prisma.storeGallery.delete).toHaveBeenCalledWith({ where: { id: 'g-1' } });
      expect(imageService.deleteImage).toHaveBeenCalledWith('https://cdn.example.com/img.jpg');
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should throw NotFoundException when item missing', async () => {
      prisma.storeGallery.findFirst.mockResolvedValue(null);
      await expect(service.deleteGalleryItem(storeId, 'bad')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadStoreImage', () => {
    it('should replace thumbnail image', async () => {
      prisma.store.findFirst.mockResolvedValue({
        id: storeId,
        thumbnailImage: 'https://cdn.example.com/old.jpg',
        coverImage: null,
        logo: null,
      });
      prisma.store.update.mockResolvedValue({});

      const result = await service.uploadStoreImage(storeId, mockFile(), 'thumbnail');

      expect(imageService.replaceImage).toHaveBeenCalledWith(
        storeId,
        'https://cdn.example.com/old.jpg',
        expect.any(Object),
        'thumbnail',
      );
      expect(prisma.store.update).toHaveBeenCalledWith({
        where: { id: storeId },
        data: { thumbnailImage: 'https://cdn.example.com/new.jpg' },
      });
      expect(result).toBe('https://cdn.example.com/new.jpg');
    });

    it('should throw NotFoundException when store missing', async () => {
      prisma.store.findFirst.mockResolvedValue(null);
      await expect(
        service.uploadStoreImage(storeId, mockFile(), 'cover'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteStoreImage', () => {
    it('should delete store image and set field to null', async () => {
      prisma.store.findFirst.mockResolvedValue({
        id: storeId,
        thumbnailImage: null,
        coverImage: 'https://cdn.example.com/cover.jpg',
        logo: null,
      });
      prisma.store.update.mockResolvedValue({});

      await service.deleteStoreImage(storeId, 'cover');

      expect(imageService.deleteImage).toHaveBeenCalledWith('https://cdn.example.com/cover.jpg');
      expect(prisma.store.update).toHaveBeenCalledWith({
        where: { id: storeId },
        data: { coverImage: null },
      });
    });

    it('should do nothing when image field is already null', async () => {
      prisma.store.findFirst.mockResolvedValue({
        id: storeId,
        thumbnailImage: null,
        coverImage: null,
        logo: null,
      });

      await service.deleteStoreImage(storeId, 'logo');

      expect(imageService.deleteImage).not.toHaveBeenCalled();
      expect(prisma.store.update).not.toHaveBeenCalled();
    });
  });
});
