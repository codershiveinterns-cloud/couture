import { getJsonStore, isRecord, sanitizeArray, storageKeys } from '../storage';
import {
  hasErrors,
  normalizeAddressInput,
  validateAddressInput,
  type AddressInput,
} from '../validation';
import { randomId } from './crypto';
import type { Address, AddressSnapshot, ServiceResult } from './types';

export const MAX_ADDRESSES = 20;
export const ADDRESS_NOT_FOUND = 'Address not found';

const EMPTY_ADDRESSES: Address[] = [];

function isAddress(value: unknown): value is Address {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country', 'createdAt', 'updatedAt'].every(
      (key) => typeof value[key] === 'string',
    ) &&
    typeof value.isDefault === 'boolean'
  );
}

/** Exactly one default when non-empty (first default wins, else the first address), default listed first. */
function normalizeList(list: Address[]): Address[] {
  if (list.length === 0) return list;
  const defaultIndex = Math.max(
    0,
    list.findIndex((a) => a.isDefault),
  );
  const withFlags = list.map((a, i) => (a.isDefault === (i === defaultIndex) ? a : { ...a, isDefault: i === defaultIndex }));
  const [defaultAddress] = withFlags.splice(defaultIndex, 1);
  return [defaultAddress, ...withFlags];
}

export function addressesStore(userId: string) {
  return getJsonStore(storageKeys.addresses(userId), EMPTY_ADDRESSES, (v) =>
    normalizeList(sanitizeArray(v, isAddress)),
  );
}

export function getAddresses(userId: string): readonly Address[] {
  return addressesStore(userId).get();
}

export function getAddress(userId: string, addressId: string): Address | undefined {
  return getAddresses(userId).find((a) => a.id === addressId);
}

export function getDefaultAddress(userId: string): Address | null {
  return getAddresses(userId).find((a) => a.isDefault) ?? null;
}

const FORM_ERROR = 'Please fix the highlighted fields';

export async function addAddress(userId: string, input: AddressInput): Promise<ServiceResult<Address>> {
  const fieldErrors = validateAddressInput(input);
  if (hasErrors(fieldErrors)) return { ok: false, error: FORM_ERROR, fieldErrors };

  const list = getAddresses(userId);
  if (list.length >= MAX_ADDRESSES) {
    return { ok: false, error: `You can save up to ${MAX_ADDRESSES} addresses` };
  }

  const values = normalizeAddressInput(input);
  const now = new Date().toISOString();
  const makeDefault = list.length === 0 || values.isDefault;
  const address: Address = { id: randomId('addr'), ...values, isDefault: makeDefault, createdAt: now, updatedAt: now };
  const base = makeDefault ? list.map((a) => (a.isDefault ? { ...a, isDefault: false } : a)) : [...list];
  const next = normalizeList([...base, address]);
  addressesStore(userId).set(next);
  return { ok: true, data: next.find((a) => a.id === address.id) ?? address };
}

/** Unchecking isDefault on the current default is ignored; choose another default instead. */
export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressInput,
): Promise<ServiceResult<Address>> {
  const list = getAddresses(userId);
  const existing = list.find((a) => a.id === addressId);
  if (!existing) return { ok: false, error: ADDRESS_NOT_FOUND };

  const fieldErrors = validateAddressInput(input);
  if (hasErrors(fieldErrors)) return { ok: false, error: FORM_ERROR, fieldErrors };

  const values = normalizeAddressInput(input);
  const makeDefault = existing.isDefault || values.isDefault;
  const updated: Address = {
    ...existing,
    ...values,
    isDefault: makeDefault,
    updatedAt: new Date().toISOString(),
  };
  const next = normalizeList(
    list.map((a) => (a.id === addressId ? updated : makeDefault && a.isDefault ? { ...a, isDefault: false } : a)),
  );
  addressesStore(userId).set(next);
  return { ok: true, data: next.find((a) => a.id === addressId) ?? updated };
}

/** Deleting the default promotes the next address in list order. */
export async function deleteAddress(userId: string, addressId: string): Promise<ServiceResult> {
  const list = getAddresses(userId);
  if (!list.some((a) => a.id === addressId)) return { ok: false, error: ADDRESS_NOT_FOUND };
  addressesStore(userId).set(normalizeList(list.filter((a) => a.id !== addressId)));
  return { ok: true, data: undefined };
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<ServiceResult<Address>> {
  const list = getAddresses(userId);
  const target = list.find((a) => a.id === addressId);
  if (!target) return { ok: false, error: ADDRESS_NOT_FOUND };
  if (target.isDefault) return { ok: true, data: target };
  const now = new Date().toISOString();
  const next = normalizeList(
    list.map((a) =>
      a.id === addressId ? { ...a, isDefault: true, updatedAt: now } : a.isDefault ? { ...a, isDefault: false } : a,
    ),
  );
  addressesStore(userId).set(next);
  return { ok: true, data: next[0] };
}

export function toAddressSnapshot(address: AddressSnapshot): AddressSnapshot {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };
}

export function addressToInput(address: Address): AddressInput {
  return { ...toAddressSnapshot(address), isDefault: address.isDefault };
}

/** ["221B Baker St, Apt 2", "London, Greater London NW1 6XE", "United Kingdom"] */
export function formatAddressLines(address: AddressSnapshot): string[] {
  return [
    [address.line1, address.line2].filter(Boolean).join(', '),
    `${address.city}, ${address.state} ${address.postalCode}`.trim(),
    address.country,
  ];
}
