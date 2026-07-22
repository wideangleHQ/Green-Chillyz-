import { PrismaService } from '../prisma.service';
import { PaginationDto } from '../../common/dto';
import { PaginatedResponse } from '../../common/interfaces';
import { paginate } from '../../common/pagination';

export abstract class BaseRepository<T> {
  constructor(protected readonly prisma: PrismaService) {}

  protected abstract get model(): any;

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findMany(
    where: Record<string, unknown> = {},
    pagination?: PaginationDto,
    orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<PaginatedResponse<T>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;

    const [items, totalItems] = await Promise.all([
      this.model.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.model.count({ where }),
    ]);

    return paginate(items, totalItems, page, pageSize);
  }

  async create(data: unknown): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: unknown): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async count(where: Record<string, unknown> = {}): Promise<number> {
    return this.model.count({ where });
  }

  async exists(where: Record<string, unknown>): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
}
