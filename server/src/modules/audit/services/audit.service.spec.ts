import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from './audit.service';
import { AuditCacheService } from './audit-cache.service';
import { AuditRepository } from '../repositories';
import { AUDIT_ENTITY_TYPES, AUDIT_ACTIONS } from '../constants';

describe('AuditService', () => {
  let service: AuditService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  const input = {
    eventType: 'wallet.credited',
    entityType: AUDIT_ENTITY_TYPES.WALLET,
    entityId: 'user-1',
    action: AUDIT_ACTIONS.CREDIT,
  };

  beforeEach(() => {
    repository = { append: vi.fn().mockResolvedValue({ id: 'audit-1' }) };
    cache = { invalidateOnAppend: vi.fn() };

    service = new AuditService(
      repository as unknown as AuditRepository,
      cache as unknown as AuditCacheService,
    );
  });

  it('should expose only a record method (no update or delete)', () => {
    const surface = service as unknown as Record<string, unknown>;

    expect(typeof surface.record).toBe('function');
    expect(surface.update).toBeUndefined();
    expect(surface.delete).toBeUndefined();
    expect(surface.remove).toBeUndefined();
  });

  it('should append the record', async () => {
    const result = await service.record(input);

    expect(result?.id).toBe('audit-1');
    expect(repository.append).toHaveBeenCalledWith(input);
  });

  it('should invalidate the affected cache surfaces after a write', async () => {
    await service.record(input);

    expect(cache.invalidateOnAppend).toHaveBeenCalledWith(
      AUDIT_ENTITY_TYPES.WALLET,
      'user-1',
    );
  });

  it('should not invalidate when the append was a duplicate', async () => {
    repository.append.mockResolvedValue(null);

    const result = await service.record(input);

    expect(result).toBeNull();
    expect(cache.invalidateOnAppend).not.toHaveBeenCalled();
  });

  it('should swallow a repository failure so the business action survives', async () => {
    repository.append.mockRejectedValue(new Error('audit store down'));

    await expect(service.record(input)).resolves.toBeNull();
  });

  it('should swallow a cache failure too', async () => {
    cache.invalidateOnAppend.mockRejectedValue(new Error('redis down'));

    await expect(service.record(input)).resolves.toBeNull();
  });
});
