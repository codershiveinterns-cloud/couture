'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { buildLoginHref } from '@/lib/safeRedirect';
import { WishlistCard } from './WishlistCard';

function HeartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5 17.7 5 19.5 8.2 22 11.9 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4';

function WishlistSkeleton() {
  return (
    <ul className={GRID} aria-busy="true" aria-label="Loading your wishlist">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="overflow-hidden rounded-sm border border-line bg-white">
          <div className="aspect-[3/4] animate-pulse bg-surface" />
          <div className="space-y-2 p-2.5">
            <div className="h-3.5 w-1/2 animate-pulse rounded-sm bg-surface" />
            <div className="h-3 w-3/4 animate-pulse rounded-sm bg-surface" />
          </div>
          <div className="h-11 animate-pulse border-t border-line bg-surface" />
        </li>
      ))}
    </ul>
  );
}

export function WishlistView() {
  const { products, count, isHydrated } = useWishlist();
  const { status } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 animate-fade-in">
      <h1 className="text-[18px] font-bold text-ink">
        My Wishlist{' '}
        {isHydrated && (
          <span className="font-normal text-ink-3">
            ({count} {count === 1 ? 'item' : 'items'})
          </span>
        )}
      </h1>

      {isHydrated && status === 'guest' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-surface px-4 py-3 text-[14px] text-ink-2">
          <p>Log in to save your wishlist across devices.</p>
          <Link
            href={buildLoginHref('/wishlist')}
            className="rounded-sm text-[12px] font-bold uppercase tracking-wide text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            Log in
          </Link>
        </div>
      )}

      <div className="mt-5">
        {!isHydrated ? (
          <WishlistSkeleton />
        ) : count === 0 ? (
          <EmptyState
            icon={<HeartIcon />}
            title={<span className="uppercase tracking-wide">Your wishlist is empty</span>}
            description="You have no items in your wishlist. Save items that you like here."
            action={<Button href="/products">Continue shopping</Button>}
          />
        ) : (
          <ul className={GRID}>
            {products.map((product) => (
              <WishlistCard key={product.id} product={product} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default WishlistView;
