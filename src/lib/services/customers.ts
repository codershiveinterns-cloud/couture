// Admin customer management: a read model over users + orders. Admin accounts are excluded.

import { roundMoney } from '../pricing';
import { storageKeys, subscribeKey, subscribePrefix } from '../storage';
import { getAddresses } from './addresses';
import { setUserStatus, usersStore } from './auth';
import { getOrders } from './orders';
import type { CustomerDetail, CustomerSummary, Order, ServiceResult, StoredUser, UserStatus } from './types';

/** Orders that count towards revenue / spending: everything except CANCELLED and REFUNDED. */
export function countsAsSale(order: Pick<Order, 'status'>): boolean {
  return order.status !== 'CANCELLED' && order.status !== 'REFUNDED';
}

function summarize(user: StoredUser, orders: readonly Order[]): CustomerSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    status: user.status,
    orderCount: orders.length,
    totalSpent: roundMoney(orders.filter(countsAsSale).reduce((sum, order) => sum + order.totals.total, 0)),
    lastOrderAt: orders[0]?.createdAt ?? null,
  };
}

const EMPTY_CUSTOMERS: readonly CustomerSummary[] = [];
let cache: { users: StoredUser[]; lists: (readonly Order[])[]; snapshot: readonly CustomerSummary[] } | null = null;

/** Newest registrations first. Referentially stable until users or orders change (useSyncExternalStore-safe). */
export function listCustomers(): readonly CustomerSummary[] {
  const users = usersStore().get();
  const customers = users.filter((u) => u.role !== 'admin');
  const lists = customers.map((u) => getOrders(u.id));
  if (
    cache &&
    cache.users === users &&
    cache.lists.length === lists.length &&
    cache.lists.every((list, index) => list === lists[index])
  ) {
    return cache.snapshot;
  }
  const summaries = customers
    .map((user, index) => summarize(user, lists[index]))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  const snapshot = summaries.length > 0 ? summaries : EMPTY_CUSTOMERS;
  cache = { users, lists, snapshot };
  return snapshot;
}

export function getServerCustomers(): readonly CustomerSummary[] {
  return EMPTY_CUSTOMERS;
}

export function subscribeCustomers(callback: () => void): () => void {
  const unsubUsers = subscribeKey(storageKeys.users, callback);
  const unsubOrders = subscribePrefix(storageKeys.ordersPrefix, callback);
  return () => {
    unsubUsers();
    unsubOrders();
  };
}

/** Summary + full order history (newest first) + saved addresses. null for unknown ids and admins. */
export function getCustomer(id: string | null | undefined): CustomerDetail | null {
  if (!id) return null;
  const user = usersStore()
    .get()
    .find((u) => u.id === id && u.role !== 'admin');
  if (!user) return null;
  const orders = getOrders(user.id);
  return { ...summarize(user, orders), orders: [...orders], addresses: [...getAddresses(user.id)] };
}

/** 'blocked' prevents sign-in ("This account has been suspended. Contact support.") and ends that user's session. */
export function setCustomerStatus(id: string, status: UserStatus): ServiceResult<CustomerSummary> {
  const result = setUserStatus(id, status);
  if (!result.ok) return result;
  const customer = listCustomers().find((c) => c.id === id);
  return customer ? { ok: true, data: customer } : { ok: false, error: 'Customer not found' };
}
