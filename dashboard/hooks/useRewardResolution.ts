import { useQuery } from '@tanstack/react-query';
import { opsApi } from '../lib/api/opsApi';
import { resolutionKeys } from '../lib/queryKeys';

export function usePreviewResolution(dto: any, enabled = true) {
  return useQuery({
    queryKey: resolutionKeys.preview(dto),
    queryFn: () => opsApi.previewRewardResolution(dto),
    enabled,
    staleTime: 60_000,
  });
}

export function useCustomerRewardSummary(customerId: string, storeId: string) {
  return useQuery({
    queryKey: resolutionKeys.customerSummary(customerId, storeId),
    queryFn: () => opsApi.getCustomerRewardSummary({ customerId, storeId }),
    enabled: !!customerId && !!storeId,
    staleTime: 60_000,
  });
}
