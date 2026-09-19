'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAddresses } from '@/hooks/useAddresses';
import { useOrders } from '@/hooks/useOrders';
import { formatDate, LoadingPanel, OrderStatusBadge, SectionCard } from './accountUtils';
import { formatPrice } from '@/lib/format';

interface Tile {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}

export function AccountOverview() {
  const { user, status } = useAuth();
  const { orders, isReady: ordersReady } = useOrders();
  const { addresses, isReady: addressesReady } = useAddresses();
  const { count: wishlistCount, isHydrated: wishlistReady } = useWishlist();

  if (status !== 'authenticated' || !user) return <LoadingPanel label="Loading your account" />;

  const tiles: Tile[] = [
    {
      href: '/account/orders',
      label: 'Orders',
      value: ordersReady ? String(orders.length) : '—',
      hint: 'Check your order status',
      icon: (
        <>
          <path d="M4 7l8-4 8 4v10l-8 4-8-4z" strokeLinejoin="round" />
          <path d="M4 7l8 4 8-4M12 11v10" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ),
    },
    {
      href: '/wishlist',
      label: 'Wishlist',
      value: wishlistReady ? String(wishlistCount) : '—',
      hint: 'Items you have saved',
      icon: (
        <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5 17.7 5 19.5 8.2 22 11.9 19.5 16.4 12 21 12 21z" />
      ),
    },
    {
      href: '/account/addresses',
      label: 'Addresses',
      value: addressesReady ? String(addresses.length) : '—',
      hint: 'Saved delivery addresses',
      icon: (
        <>
          <path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      ),
    },
    {
      href: '/account/profile',
      label: 'Profile',
      value: user.name.split(' ')[0],
      hint: 'Name, phone & password',
      icon: (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
        </>
      ),
    },
  ];

  const recent = orders.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.href}>
            <Link
              href={tile.href}
              className="group flex h-full flex-col rounded-sm border border-line bg-white p-5 transition-all hover:border-line-strong hover:shadow-[0_2px_16px_4px_rgba(40,44,63,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  {tile.icon}
                </svg>
              </span>
              <span className="mt-4 text-[12px] font-bold uppercase tracking-wide text-ink-3">{tile.label}</span>
              <span className="mt-1 truncate text-[20px] font-bold text-ink">{tile.value}</span>
              <span className="mt-1 text-[13px] text-ink-3 transition-colors group-hover:text-ink-2">{tile.hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      <SectionCard title="Recent orders" description="Your latest purchases, newest first.">
        {!ordersReady ? (
          <div className="animate-pulse">
            <div className="h-4 w-full rounded-sm bg-surface" />
            <div className="mt-2 h-4 w-2/3 rounded-sm bg-surface" />
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[14px] text-ink-3">You have not placed any orders yet.</p>
            <Link href="/products" className="text-[13px] font-bold uppercase tracking-wide text-brand hover:underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="text-[14px] font-bold text-ink transition-colors hover:text-brand"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    {formatDate(order.createdAt)} · {order.totals.itemCount} {order.totals.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-[14px] font-bold text-ink">{formatPrice(order.totals.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {ordersReady && orders.length > recent.length && (
          <Link
            href="/account/orders"
            className="mt-4 inline-block text-[13px] font-bold uppercase tracking-wide text-brand hover:underline"
          >
            View all orders →
          </Link>
        )}
      </SectionCard>
    </div>
  );
}

export default AccountOverview;
