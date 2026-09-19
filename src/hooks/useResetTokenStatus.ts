import { useCallback, useSyncExternalStore } from 'react';
import { getResetTokenStatus, subscribeResetTokens } from '@/lib/services/auth';
import type { ResetTokenStatus } from '@/lib/services/types';

const getServerSnapshot = (): ResetTokenStatus | 'loading' => 'loading';

/** 'loading' during SSR/hydration, then 'valid' | 'invalid' | 'expired' | 'used' (live-updates after reset). */
export function useResetTokenStatus(token: string | null | undefined): ResetTokenStatus | 'loading' {
  const getSnapshot = useCallback((): ResetTokenStatus | 'loading' => getResetTokenStatus(token), [token]);
  return useSyncExternalStore(subscribeResetTokens, getSnapshot, getServerSnapshot);
}
