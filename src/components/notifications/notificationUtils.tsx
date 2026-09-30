import type { NotificationType } from '@/lib/services/types';

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return '';
  const diff = Math.max(0, now - time);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(time));
}

const TONES: Record<NotificationType, string> = {
  REGISTRATION: 'bg-brand-light text-brand',
  ORDER_CONFIRMATION: 'bg-[#e7f5f4] text-rating',
  PAYMENT_RECEIVED: 'bg-[#e6f7f3] text-success',
  PAYMENT_FAILED: 'bg-brand-light text-brand-dark',
  ORDER_STATUS: 'bg-surface text-ink-2',
  ORDER_SHIPPED: 'bg-[#fff3e8] text-discount',
  ORDER_DELIVERED: 'bg-[#e6f7f3] text-success',
  ORDER_CANCELLED: 'bg-brand-light text-brand-dark',
  ORDER_REFUNDED: 'bg-surface text-ink-2',
};

function Glyph({ type }: { type: NotificationType }) {
  switch (type) {
    case 'REGISTRATION':
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </>
      );
    case 'ORDER_CONFIRMATION':
      return (
        <>
          <path d="M6 2h12l2 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6l2-4z" />
          <path d="M4 6h16M9 10a3 3 0 006 0" />
        </>
      );
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_FAILED':
      return (
        <>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h4" />
        </>
      );
    case 'ORDER_SHIPPED':
      return (
        <>
          <path d="M3 7h11v9H3z" />
          <path d="M14 10h4l3 3v3h-7" />
          <circle cx="7" cy="18" r="1.8" />
          <circle cx="17" cy="18" r="1.8" />
        </>
      );
    case 'ORDER_DELIVERED':
      return (
        <>
          <path d="M4 7l8-4 8 4v10l-8 4-8-4z" />
          <path d="M9 12l2 2 4-4" />
        </>
      );
    case 'ORDER_CANCELLED':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 8l8 8M16 8l-8 8" />
        </>
      );
    case 'ORDER_REFUNDED':
      return <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" />;
    case 'ORDER_STATUS':
    default:
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l3 2" />
        </>
      );
  }
}

/** Round tinted icon for a notification type (same tones as the status badges). */
export function NotificationTypeIcon({ type, size = 36 }: { type: NotificationType; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full ${TONES[type] ?? TONES.ORDER_STATUS}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={Math.round(size * 0.5)}
        height={Math.round(size * 0.5)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Glyph type={type} />
      </svg>
    </span>
  );
}

export function BellIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9a6 6 0 0112 0v4l2 3H4l2-3V9z" />
      <path d="M10 19a2 2 0 004 0" />
    </svg>
  );
}
