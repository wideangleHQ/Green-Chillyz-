import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../../providers/redis/redis.service';
import { MENU_CACHE } from '../constants';

@Injectable()
export class MenuCacheService {
  private readonly logger = new Logger(MenuCacheService.name);

  constructor(private readonly redis: RedisService) {}

  private async safeGet<T>(fn: () => Promise<T | null>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  private async safeWrite(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch {
      // Redis unavailable — skip silently
    }
  }

  buildListKey(prefix: string, query: Record<string, unknown>): string {
    const normalized = Object.keys(query)
      .filter((key) => query[key] !== undefined && query[key] !== null)
      .sort()
      .map((key) => `${key}=${String(query[key])}`)
      .join('&');
    const hash = createHash('sha1').update(normalized).digest('hex').slice(0, 16);

    return `${prefix}${hash}`;
  }

  async getCategories<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(MENU_CACHE.CATEGORIES));
  }

  async setCategories(data: unknown): Promise<void> {
    await this.safeWrite(() => this.redis.set(MENU_CACHE.CATEGORIES, data, MENU_CACHE.TTL_CATEGORIES));
  }

  async getCategoryTree<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(MENU_CACHE.CATEGORY_TREE));
  }

  async setCategoryTree(data: unknown): Promise<void> {
    await this.safeWrite(() => this.redis.set(MENU_CACHE.CATEGORY_TREE, data, MENU_CACHE.TTL_CATEGORIES));
  }

  async getCategory<T>(idOrSlug: string): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(`${MENU_CACHE.CATEGORY}${idOrSlug}`));
  }

  async setCategory(idOrSlug: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(`${MENU_CACHE.CATEGORY}${idOrSlug}`, data, MENU_CACHE.TTL_CATEGORY),
    );
  }

  async getItem<T>(idOrSlug: string): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(`${MENU_CACHE.ITEM}${idOrSlug}`));
  }

  async setItem(idOrSlug: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(`${MENU_CACHE.ITEM}${idOrSlug}`, data, MENU_CACHE.TTL_ITEM),
    );
  }

  async getItems<T>(key: string): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(key));
  }

  async setItems(key: string, data: unknown): Promise<void> {
    await this.safeWrite(() => this.redis.set(key, data, MENU_CACHE.TTL_ITEMS));
  }

  async getTags<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(MENU_CACHE.TAGS));
  }

  async setTags(data: unknown): Promise<void> {
    await this.safeWrite(() => this.redis.set(MENU_CACHE.TAGS, data, MENU_CACHE.TTL_TAGS));
  }

  async getFeatured<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(MENU_CACHE.FEATURED));
  }

  async setFeatured(data: unknown): Promise<void> {
    await this.safeWrite(() => this.redis.set(MENU_CACHE.FEATURED, data, MENU_CACHE.TTL_FEATURED));
  }

  async getPopular<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(MENU_CACHE.POPULAR));
  }

  async setPopular(data: unknown): Promise<void> {
    await this.safeWrite(() => this.redis.set(MENU_CACHE.POPULAR, data, MENU_CACHE.TTL_POPULAR));
  }

  async getSearch<T>(key: string): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(key));
  }

  async setSearch(key: string, data: unknown): Promise<void> {
    await this.safeWrite(() => this.redis.set(key, data, MENU_CACHE.TTL_SEARCH));
  }

  buildSearchKey(query: string, filters: Record<string, unknown> = {}): string {
    return this.buildListKey(MENU_CACHE.SEARCH, { q: query, ...filters });
  }

  async invalidateItem(itemId: string, slug?: string): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${MENU_CACHE.ITEM}${itemId}`);
      if (slug) await this.redis.del(`${MENU_CACHE.ITEM}${slug}`);
    });
    await this.invalidateListings();
  }

  async invalidateListings(): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.delPattern(`${MENU_CACHE.ITEMS}*`);
      await this.redis.delPattern(`${MENU_CACHE.SEARCH}*`);
      await this.redis.del(MENU_CACHE.FEATURED);
      await this.redis.del(MENU_CACHE.POPULAR);
    });
  }

  async invalidateCategory(categoryId: string, slug?: string): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${MENU_CACHE.CATEGORY}${categoryId}`);
      if (slug) await this.redis.del(`${MENU_CACHE.CATEGORY}${slug}`);
      await this.redis.del(MENU_CACHE.CATEGORIES);
      await this.redis.del(MENU_CACHE.CATEGORY_TREE);
    });
    await this.invalidateListings();
  }

  async invalidateTags(): Promise<void> {
    await this.safeWrite(() => this.redis.del(MENU_CACHE.TAGS));
    await this.invalidateListings();
  }

  async invalidateAll(): Promise<void> {
    await this.safeWrite(() => this.redis.delPattern(`${MENU_CACHE.PREFIX}*`));
  }
}
