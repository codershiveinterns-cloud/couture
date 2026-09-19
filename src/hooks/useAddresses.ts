import { useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  addAddress,
  addressesStore,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from '@/lib/services/addresses';
import type { Address, ServiceResult } from '@/lib/services/types';
import type { AddressInput } from '@/lib/validation';

const EMPTY: readonly Address[] = [];
const noopSubscribe = () => () => {};
const getEmpty = () => EMPTY;
const SIGNED_OUT = { ok: false as const, error: 'Please sign in to manage your addresses' };

export interface UseAddressesResult {
  /** Default address first. */
  addresses: readonly Address[];
  defaultAddress: Address | null;
  /** false until auth has hydrated. */
  isReady: boolean;
  isAuthenticated: boolean;
  getAddress(addressId: string): Address | undefined;
  addAddress(input: AddressInput): Promise<ServiceResult<Address>>;
  updateAddress(addressId: string, input: AddressInput): Promise<ServiceResult<Address>>;
  deleteAddress(addressId: string): Promise<ServiceResult>;
  setDefaultAddress(addressId: string): Promise<ServiceResult<Address>>;
}

export function useAddresses(): UseAddressesResult {
  const { user, status } = useAuth();
  const userId = user?.id ?? null;
  const store = useMemo(() => (userId ? addressesStore(userId) : null), [userId]);
  const addresses = useSyncExternalStore<readonly Address[]>(
    store ? store.subscribe : noopSubscribe,
    store ? store.get : getEmpty,
    getEmpty,
  );

  return useMemo<UseAddressesResult>(
    () => ({
      addresses,
      defaultAddress: addresses.find((a) => a.isDefault) ?? null,
      isReady: status !== 'loading',
      isAuthenticated: !!userId,
      getAddress: (addressId) => addresses.find((a) => a.id === addressId),
      addAddress: (input) => (userId ? addAddress(userId, input) : Promise.resolve(SIGNED_OUT)),
      updateAddress: (addressId, input) =>
        userId ? updateAddress(userId, addressId, input) : Promise.resolve(SIGNED_OUT),
      deleteAddress: (addressId) => (userId ? deleteAddress(userId, addressId) : Promise.resolve(SIGNED_OUT)),
      setDefaultAddress: (addressId) =>
        userId ? setDefaultAddress(userId, addressId) : Promise.resolve(SIGNED_OUT),
    }),
    [addresses, status, userId],
  );
}
