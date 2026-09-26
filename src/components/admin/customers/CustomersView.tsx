'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage, StatusPill } from '@/components/admin/AdminPage';
import {
  Avatar,
  FilterSelect,
  formatDate,
  LINK_CLASS,
  Pagination,
  SearchBox,
  TableEmpty,
  TableSkeleton,
} from '@/components/admin/orders/shared';
import { Button } from '@/components/ui';
import { useCustomers } from '@/hooks/useCustomers';
import { formatPrice } from '@/lib/format';
import type { CustomerSummary, UserStatus } from '@/lib/services/types';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | UserStatus;
type SortOption = 'newest' | 'spend' | 'orders' | 'recent' | 'name';

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All customers' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
];
const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest registered' },
  { value: 'spend', label: 'Highest spend' },
  { value: 'orders', label: 'Most orders' },
  { value: 'recent', label: 'Most recent order' },
  { value: 'name', label: 'Name A–Z' },
];

const SORTERS: Record<SortOption, (a: CustomerSummary, b: CustomerSummary) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  spend: (a, b) => b.totalSpent - a.totalSpent,
  orders: (a, b) => b.orderCount - a.orderCount,
  recent: (a, b) => (b.lastOrderAt ?? '').localeCompare(a.lastOrderAt ?? ''),
  name: (a, b) => a.name.localeCompare(b.name),
};

export function CustomerStatusPill({ status }: { status: UserStatus }) {
  return <StatusPill tone={status === 'active' ? 'success' : 'danger'}>{status === 'active' ? 'Active' : 'Blocked'}</StatusPill>;
}

export function CustomersView() {
  const { customers, isHydrated } = useCustomers();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return customers
      .filter((customer) => {
        if (status !== 'all' && customer.status !== status) return false;
        if (!needle) return true;
        return (
          customer.name.toLowerCase().includes(needle) ||
          customer.email.toLowerCase().includes(needle) ||
          (customer.phone ?? '').toLowerCase().includes(needle)
        );
      })
      .sort(SORTERS[sort]);
  }, [customers, search, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  return (
    <AdminPage title="Customers" description="Registered shoppers, their order history and account status.">
      <AdminCard padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3">
          <SearchBox
            id="customers-search"
            label="Search customers"
            placeholder="Search name, email or phone"
            value={search}
            onChange={withReset(setSearch)}
            className="w-full sm:w-auto sm:flex-1 sm:basis-64"
          />
          <FilterSelect id="customers-status" label="Status" value={status} onChange={withReset(setStatus)} options={STATUS_OPTIONS} />
          <FilterSelect id="customers-sort" label="Sort by" value={sort} onChange={withReset(setSort)} options={SORT_OPTIONS} />
        </div>

        {!isHydrated ? (
          <TableSkeleton rows={6} />
        ) : (
          <>
            <div className={ADMIN_TABLE.wrap}>
              <table className={`${ADMIN_TABLE.table} min-w-[960px]`}>
                <caption className="sr-only">Customers</caption>
                <thead>
                  <tr>
                    {['Customer', 'Phone', 'Registered'].map((heading) => (
                      <th key={heading} scope="col" className={ADMIN_TABLE.th}>
                        {heading}
                      </th>
                    ))}
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Orders
                    </th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Total spent
                    </th>
                    <th scope="col" className={ADMIN_TABLE.th}>
                      Last order
                    </th>
                    <th scope="col" className={ADMIN_TABLE.th}>
                      Status
                    </th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <TableEmpty colSpan={8}>
                      {customers.length === 0 ? 'No customers have registered yet.' : 'No customers match these filters.'}
                    </TableEmpty>
                  ) : (
                    visible.map((customer) => {
                      const href = `/admin/customers/${encodeURIComponent(customer.id)}`;
                      return (
                        <tr key={customer.id} className={ADMIN_TABLE.row}>
                          <th scope="row" className={`${ADMIN_TABLE.td} font-normal`}>
                            <div className="flex items-center gap-3">
                              <Avatar name={customer.name} />
                              <div className="min-w-0">
                                <Link href={href} className={LINK_CLASS}>
                                  {customer.name}
                                </Link>
                                <div className="text-[12px] text-ink-3">{customer.email}</div>
                              </div>
                            </div>
                          </th>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>{customer.phone ?? '—'}</td>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>{formatDate(customer.createdAt)}</td>
                          <td className={`${ADMIN_TABLE.td} text-right tabular-nums`}>{customer.orderCount}</td>
                          <td className={`${ADMIN_TABLE.td} text-right font-bold text-ink tabular-nums`}>
                            {formatPrice(customer.totalSpent)}
                          </td>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>{formatDate(customer.lastOrderAt)}</td>
                          <td className={ADMIN_TABLE.td}>
                            <CustomerStatusPill status={customer.status} />
                          </td>
                          <td className={`${ADMIN_TABLE.td} text-right`}>
                            <Button href={href} variant="secondary" size="sm" aria-label={`View ${customer.name}`}>
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPage={setPage}
              noun="customers"
            />
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}

export default CustomersView;
