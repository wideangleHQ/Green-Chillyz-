import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { DASHBOARD_OPS_ERRORS } from '../constants';

export interface ScopedCustomer {
  userId: string;
  customerProfileId: string;
  assignedStoreId: string;
  fullName: string;
}

/**
 * The store-scope boundary for every customer-addressed dashboard read.
 *
 * A dashboard principal is a store; it may only see customers assigned to it.
 * Out-of-scope customers are reported as not found — never as forbidden — so
 * the API does not leak that a customer id exists at another store.
 */
@Injectable()
export class DashboardCustomerScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts `userId` is an active customer of `storeId` and returns the
   * minimal identity needed by callers. One indexed read.
   */
  async assertCustomerInStore(
    userId: string,
    storeId: string,
  ): Promise<ScopedCustomer> {
    const profile = await this.prisma.customerProfile.findFirst({
      where: {
        userId,
        assignedStoreId: storeId,
        user: { deletedAt: null },
      },
      select: {
        id: true,
        userId: true,
        assignedStoreId: true,
        user: { select: { fullName: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException(DASHBOARD_OPS_ERRORS.CUSTOMER_NOT_FOUND);
    }

    return {
      userId: profile.userId,
      customerProfileId: profile.id,
      assignedStoreId: profile.assignedStoreId,
      fullName: profile.user.fullName,
    };
  }

  /** Prisma relation filter selecting users assigned to the store. */
  storeScopedUserFilter(storeId: string) {
    return {
      deletedAt: null,
      customerProfile: { assignedStoreId: storeId },
    } as const;
  }
}
