import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { StoreImageService } from './store-image.service';
import { StorageService } from '../../../providers/storage/storage.service';

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

describe('StoreImageService', () => {
  let service: StoreImageService;
  let storage: {
    upload: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    storage = {
      upload: vi.fn().mockResolvedValue('https://cdn.example.com/stores/thumbnails/store-1/uuid.jpg'),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    service = new StoreImageService(storage as unknown as StorageService);
  });

  describe('uploadImage', () => {
    it('should upload valid image and return URL', async () => {
      const file = mockFile();
      const result = await service.uploadImage('store-1', file, 'thumbnail');

      expect(storage.upload).toHaveBeenCalledTimes(1);
      const [key, buffer, mime] = storage.upload.mock.calls[0];
      expect(key).toContain('stores/thumbnails/store-1/');
      expect(key.endsWith('.jpg')).toBe(true);
      expect(buffer).toBe(file.buffer);
      expect(mime).toBe('image/jpeg');
      expect(result).toBe('https://cdn.example.com/stores/thumbnails/store-1/uuid.jpg');
    });

    it('should use correct path for each image type', async () => {
      const types = ['thumbnail', 'cover', 'logo', 'gallery'] as const;
      const paths = ['stores/thumbnails', 'stores/covers', 'stores/logos', 'stores/gallery'];

      for (let i = 0; i < types.length; i++) {
        storage.upload.mockClear();
        await service.uploadImage('s1', mockFile(), types[i]);
        const key = storage.upload.mock.calls[0][0];
        expect(key).toContain(paths[i]);
      }
    });

    it('should reject invalid mime type', async () => {
      const file = mockFile({ mimetype: 'image/gif' });
      await expect(service.uploadImage('s1', file, 'thumbnail')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject files over 5MB', async () => {
      const file = mockFile({ size: 6 * 1024 * 1024 });
      await expect(service.uploadImage('s1', file, 'thumbnail')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept WebP and AVIF', async () => {
      for (const mime of ['image/webp', 'image/avif']) {
        storage.upload.mockClear();
        const file = mockFile({ mimetype: mime, originalname: `photo.${mime.split('/')[1]}` });
        await expect(service.uploadImage('s1', file, 'gallery')).resolves.toBeDefined();
      }
    });

    it('should throw BadRequestException when upload fails', async () => {
      storage.upload.mockRejectedValue(new Error('S3 error'));
      const file = mockFile();
      await expect(service.uploadImage('s1', file, 'thumbnail')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteImage', () => {
    it('should extract key from URL and delete', async () => {
      await service.deleteImage('https://cdn.example.com/stores/gallery/s1/abc.jpg');
      expect(storage.delete).toHaveBeenCalledWith('stores/gallery/s1/abc.jpg');
    });

    it('should not throw on invalid URL', async () => {
      await expect(service.deleteImage('not-a-url')).resolves.toBeUndefined();
    });

    it('should swallow delete errors', async () => {
      storage.delete.mockRejectedValue(new Error('S3 error'));
      await expect(
        service.deleteImage('https://cdn.example.com/stores/gallery/s1/abc.jpg'),
      ).resolves.toBeUndefined();
    });
  });

  describe('replaceImage', () => {
    it('should upload new and delete old', async () => {
      const file = mockFile();
      storage.upload.mockResolvedValue('https://cdn.example.com/new.jpg');

      const result = await service.replaceImage(
        's1',
        'https://cdn.example.com/old.jpg',
        file,
        'cover',
      );

      expect(result).toBe('https://cdn.example.com/new.jpg');
      expect(storage.upload).toHaveBeenCalledTimes(1);
      expect(storage.delete).toHaveBeenCalledWith('old.jpg');
    });

    it('should not delete when oldImageUrl is null', async () => {
      storage.upload.mockResolvedValue('https://cdn.example.com/new.jpg');
      await service.replaceImage('s1', null, mockFile(), 'logo');
      expect(storage.delete).not.toHaveBeenCalled();
    });
  });
});
