import Link from 'next/link';
import FadeImage from '@/components/FadeImage';
import { formatPrice } from '@/lib/format';

export interface OrderItemLike {
  slug: string;
  name: string;
  image: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  brand?: string | null;
}

export function OrderItemsList({ items, className = '' }: { items: readonly OrderItemLike[]; className?: string }) {
  return (
    <ul className={`divide-y divide-line ${className}`}>
      {items.map((item, index) => (
        <li key={`${item.slug}-${item.variantLabel ?? ''}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <Link
            href={`/products/${item.slug}`}
            className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-sm bg-surface"
            aria-label={item.name}
          >
            {item.image ? (
              <FadeImage src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] text-ink-4">No image</span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            {item.brand && <p className="truncate text-[13px] font-bold text-ink">{item.brand}</p>}
            <Link href={`/products/${item.slug}`} className="line-clamp-1 text-[13px] text-ink-2 hover:text-ink">
              {item.name}
            </Link>
            <p className="mt-0.5 text-[12px] text-ink-3">
              {item.variantLabel ? `${item.variantLabel} · ` : ''}
              Qty {item.quantity} × {formatPrice(item.unitPrice)}
            </p>
          </div>
          <p className="shrink-0 text-[14px] font-bold tabular-nums text-ink">{formatPrice(item.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

export default OrderItemsList;
