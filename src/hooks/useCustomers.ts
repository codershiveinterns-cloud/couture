import { useMemo, useSyncExternalStore } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import { getCustomer, getServerCustomers, listCustomers, subscribeCustomers } from '@/lib/services/customers';
import type { CustomerDetail, CustomerSummary } from '@/lib/services/types';

export interface UseCustomersResult {
  /** Newest registrations first; admins excluded. [] during SSR/hydration. */
  customers: readonly CustomerSummary[];
  isHydrated: boolean;
}

/** Live customer list. Mutation: setCustomerStatus(id, 'active' | 'blocked') from services/customers. */
export function useCustomers(): UseCustomersResult {
  const customers = useSyncExternalStore(subscribeCustomers, listCustomers, getServerCustomers);
  const isHydrated = useHydrated();
  return useMemo(() => ({ customers, isHydrated }), [customers, isHydrated]);
}

/** One customer with order history + addresses; null when missing (or before hydration). */
export function useCustomer(id: string | null | undefined): { customer: CustomerDetail | null; isHydrated: boolean } {
  const { customers, isHydrated } = useCustomers();
  const customer = useMemo(
    () => (isHydrated && id && customers.some((c) => c.id === id) ? getCustomer(id) : null),
    [customers, id, isHydrated],
  );
  return { customer, isHydrated };
}
