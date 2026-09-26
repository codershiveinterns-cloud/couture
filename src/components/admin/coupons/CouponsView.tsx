'use client';

import { useMemo, useState } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage, StatusPill, type PillTone } from '@/components/admin/AdminPage';
import { FilterSelect, formatDate, SearchBox, StatTile, TableEmpty, TableSkeleton } from '@/components/admin/orders/shared';
import { Button, Modal } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useCoupons } from '@/hooks/useCoupons';
import { formatPrice } from '@/lib/format';
import type { Coupon } from '@/lib/coupons';
import { couponLifecycle, deleteCoupon, toggleCouponActive, type CouponLifecycle } from '@/lib/services/coupons';
import { CouponFormModal } from './CouponFormModal';

type LifecycleFilter = 'all' | CouponLifecycle;

const LIFECYCLE_LABELS: Record<CouponLifecycle, string> = {
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
  exhausted: 'Limit reached',
};
const LIFECYCLE_TONES: Record<CouponLifecycle, PillTone> = {
  active: 'success',
  inactive: 'neutral',
  expired: 'danger',
  exhausted: 'warning',
};
const FILTER_OPTIONS: readonly { value: LifecycleFilter; label: string }[] = [
  { value: 'all', label: 'All coupons' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
  { value: 'exhausted', label: 'Limit reached' },
];

type Editor = { coupon: Coupon | null; key: number } | null;

function UsageCell({ coupon }: { coupon: Coupon }) {
  if (coupon.usageLimit === null) {
    return (
      <span className="whitespace-nowrap tabular-nums">
        {coupon.usedCount} <span className="text-ink-3">/ unlimited</span>
      </span>
    );
  }
  const percent = Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100));
  return (
    <div className="w-28">
      <div className="flex justify-between text-[12px] tabular-nums">
        <span className="font-bold text-ink">
          {coupon.usedCount} / {coupon.usageLimit}
        </span>
        <span className="text-ink-3">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${coupon.code} usage`}
        aria-valuemin={0}
        aria-valuemax={coupon.usageLimit}
        aria-valuenow={Math.min(coupon.usedCount, coupon.usageLimit)}
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface"
      >
        <div className={`h-full rounded-full ${percent >= 100 ? 'bg-discount' : 'bg-success'}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ActiveSwitch({ coupon }: { coupon: Coupon }) {
  const toggle = () => {
    const result = toggleCouponActive(coupon.code, !coupon.active);
    if (!result.ok) toast.error(result.error);
    else toast.success(`${coupon.code} ${result.data.active ? 'activated' : 'deactivated'}`);
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={coupon.active}
      aria-label={`${coupon.code} active`}
      onClick={toggle}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 ${
        coupon.active ? 'bg-success' : 'bg-line-strong'
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${coupon.active ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

export function CouponsView() {
  const { coupons, isHydrated } = useCoupons();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LifecycleFilter>('all');
  const [editor, setEditor] = useState<Editor>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const rows = useMemo(() => coupons.map((coupon) => ({ coupon, lifecycle: couponLifecycle(coupon) })), [coupons]);

  const summary = useMemo(
    () => ({
      active: rows.filter((row) => row.lifecycle === 'active').length,
      expired: rows.filter((row) => row.lifecycle === 'expired').length,
      redemptions: rows.reduce((sum, row) => sum + row.coupon.usedCount, 0),
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter(
      ({ coupon, lifecycle }) =>
        (filter === 'all' || lifecycle === filter) &&
        (!needle || coupon.code.toLowerCase().includes(needle) || coupon.description.toLowerCase().includes(needle)),
    );
  }, [rows, search, filter]);

  const openEditor = (coupon: Coupon | null) => setEditor((current) => ({ coupon, key: (current?.key ?? 0) + 1 }));

  const confirmDelete = () => {
    if (!deleting) return;
    const result = deleteCoupon(deleting.code);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Coupon ${deleting.code} deleted`);
    setDeleting(null);
  };

  return (
    <AdminPage
      title="Coupons"
      description="Create discount codes and control when they can be redeemed."
      actions={
        <Button size="sm" onClick={() => openEditor(null)} disabled={!isHydrated}>
          New coupon
        </Button>
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Active" value={isHydrated ? summary.active : '—'} hint="Redeemable right now" />
        <StatTile label="Expired" value={isHydrated ? summary.expired : '—'} hint="Past their expiry date" />
        <StatTile label="Total redemptions" value={isHydrated ? summary.redemptions : '—'} hint="Orders placed with a coupon" />
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3">
          <SearchBox
            id="coupons-search"
            label="Search coupons"
            placeholder="Search code or description"
            value={search}
            onChange={setSearch}
            className="w-full sm:w-auto sm:flex-1 sm:basis-64"
          />
          <FilterSelect id="coupons-filter" label="Status" value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
        </div>

        {!isHydrated ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className={ADMIN_TABLE.wrap}>
            <table className={`${ADMIN_TABLE.table} min-w-[1000px]`}>
              <caption className="sr-only">Coupons</caption>
              <thead>
                <tr>
                  <th scope="col" className={ADMIN_TABLE.th}>
                    Code
                  </th>
                  <th scope="col" className={ADMIN_TABLE.th}>
                    Discount
                  </th>
                  <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                    Min order
                  </th>
                  <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                    Max discount
                  </th>
                  <th scope="col" className={ADMIN_TABLE.th}>
                    Expiry
                  </th>
                  <th scope="col" className={ADMIN_TABLE.th}>
                    Usage
                  </th>
                  <th scope="col" className={ADMIN_TABLE.th}>
                    Status
                  </th>
                  <th scope="col" className={ADMIN_TABLE.th}>
                    Active
                  </th>
                  <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <TableEmpty colSpan={9}>
                    {coupons.length === 0 ? 'No coupons yet — create your first one.' : 'No coupons match these filters.'}
                  </TableEmpty>
                ) : (
                  filtered.map(({ coupon, lifecycle }) => (
                    <tr key={coupon.code} className={ADMIN_TABLE.row}>
                      <th scope="row" className={`${ADMIN_TABLE.td} font-normal`}>
                        <span className="inline-block rounded-sm border border-dashed border-line-strong bg-surface px-2 py-0.5 font-mono text-[13px] font-bold text-ink">
                          {coupon.code}
                        </span>
                        <div className="mt-1 max-w-[240px] text-[12px] text-ink-3">{coupon.description}</div>
                      </th>
                      <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>
                        <span className="font-bold text-ink">{coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}</span>
                        <div className="text-[12px] text-ink-3">{coupon.type === 'percentage' ? 'Percentage' : 'Fixed amount'}</div>
                      </td>
                      <td className={`${ADMIN_TABLE.td} text-right tabular-nums`}>{coupon.minOrder > 0 ? formatPrice(coupon.minOrder) : '—'}</td>
                      <td className={`${ADMIN_TABLE.td} text-right tabular-nums`}>
                        {coupon.maxDiscount !== null ? formatPrice(coupon.maxDiscount) : '—'}
                      </td>
                      <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>
                        {coupon.expiresAt ? (
                          <span className={lifecycle === 'expired' ? 'font-bold text-brand' : ''}>
                            {formatDate(coupon.expiresAt)}
                            {lifecycle === 'expired' && <span className="ml-1.5 text-[11px] uppercase tracking-wide">Expired</span>}
                          </span>
                        ) : (
                          <span className="text-ink-3">Never</span>
                        )}
                      </td>
                      <td className={ADMIN_TABLE.td}>
                        <UsageCell coupon={coupon} />
                      </td>
                      <td className={ADMIN_TABLE.td}>
                        <StatusPill tone={LIFECYCLE_TONES[lifecycle]}>{LIFECYCLE_LABELS[lifecycle]}</StatusPill>
                      </td>
                      <td className={ADMIN_TABLE.td}>
                        <ActiveSwitch coupon={coupon} />
                      </td>
                      <td className={`${ADMIN_TABLE.td} text-right`}>
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEditor(coupon)} aria-label={`Edit ${coupon.code}`}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleting(coupon)} aria-label={`Delete ${coupon.code}`}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {editor && <CouponFormModal key={editor.key} coupon={editor.coupon} onClose={() => setEditor(null)} />}

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        size="sm"
        title={`Delete ${deleting?.code ?? 'coupon'}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep coupon
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink-2">
          Shoppers will no longer be able to apply this code, and it is removed from any bag it is currently applied to. Past orders keep
          their discount. To pause it instead, switch it to inactive.
        </p>
      </Modal>
    </AdminPage>
  );
}

export default CouponsView;
