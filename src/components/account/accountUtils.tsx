import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/services/orders';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/services/types';

// Shared tone mapping (same as the admin screens): early states info, in-transit warning,
// delivered success, cancelled danger, refunded neutral.
export const ORDER_STATUS_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  PLACED: 'info',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  SHIPPED: 'warning',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'neutral',
};

export const PAYMENT_STATUS_VARIANTS: Record<PaymentStatus, BadgeVariant> = {
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  CANCELLED: 'neutral',
  REFUNDED: 'neutral',
};

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMAT.format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME_FORMAT.format(date);
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_STATUS_VARIANTS[status] ?? 'neutral'} dot>
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

/** `method` tweaks the wording for unpaid cash orders ("Pay on delivery" instead of "Pending"). */
export function PaymentStatusBadge({ status, method }: { status: PaymentStatus; method?: PaymentMethod }) {
  return (
    <Badge variant={PAYMENT_STATUS_VARIANTS[status] ?? 'neutral'} size="sm">
      {paymentStatusLabel(status, method)}
    </Badge>
  );
}

export function paymentStatusLabel(status: PaymentStatus, method?: PaymentMethod): string {
  if (status === 'PENDING' && method === 'COD') return 'Pay on delivery';
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

/** Right-hand account panel: white, thin border, squared corners, uppercase section label. */
export function SectionCard({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = `${slugify(title)}-heading`;
  return (
    <section aria-labelledby={headingId} className={`rounded-sm border border-line bg-white p-5 ${className}`}>
      <div className="mb-5 border-b border-line pb-4">
        <h2 id={headingId} className="text-[12px] font-bold uppercase tracking-wide text-ink">
          {title}
        </h2>
        {description && <p className="mt-1 text-[13px] text-ink-3">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function LoadingPanel({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="animate-pulse rounded-sm border border-line bg-white p-5">
      <div className="h-3 w-32 rounded-sm bg-surface" />
      <div className="mt-5 h-4 w-full rounded-sm bg-surface" />
      <div className="mt-2 h-4 w-3/4 rounded-sm bg-surface" />
    </div>
  );
}

export function InlineFormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-sm border border-brand/40 bg-brand-light px-3.5 py-3 text-[13px] text-brand-dark">
      {message}
    </p>
  );
}
