// Shared order status timeline (PRD 4.13): Placed -> Confirmed -> Processing -> Shipped ->
// Out for Delivery -> Delivered, with cancellation / refund as terminal states. Used by the
// public /track page; the account OrderDetail renders the same logic.

import { formatDateTime } from '@/components/account/accountUtils';
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, orderStatusStep } from '@/lib/services/orders';
import type { Order, OrderStatus, OrderStatusEvent } from '@/lib/services/types';

export type StepState = 'done' | 'current' | 'upcoming' | 'cancelled' | 'refunded';

export interface TimelineStep {
  key: string;
  label: string;
  state: StepState;
  at: string | null;
  note: string | null;
}

const lastEvent = (history: readonly OrderStatusEvent[], status: OrderStatus) =>
  [...history].reverse().find((event) => event.status === status);

/**
 * Open / delivered orders: the full ORDER_STATUS_FLOW with timestamps from statusHistory (steps the
 * admin skipped are still marked complete, just without a time). Cancelled / refunded orders: what
 * actually happened, ending in the terminal state.
 */
export function buildTimeline(order: Order): TimelineStep[] {
  const history = order.statusHistory ?? [];
  const currentStep = orderStatusStep(order.status);

  if (currentStep >= 0) {
    const delivered = order.status === 'DELIVERED';
    return ORDER_STATUS_FLOW.map((status, index) => {
      const event = lastEvent(history, status);
      const state: StepState =
        index < currentStep || (delivered && index === currentStep) ? 'done' : index === currentStep ? 'current' : 'upcoming';
      return {
        key: status,
        label: ORDER_STATUS_LABELS[status],
        state,
        at: index <= currentStep ? (event?.at ?? (index === 0 ? order.createdAt : null)) : null,
        note: index <= currentStep ? (event?.note ?? null) : null,
      };
    });
  }

  const events = history.length > 0 ? history : [{ status: order.status, at: order.updatedAt }];
  return events.map((event, index) => ({
    key: `${event.status}-${index}`,
    label: ORDER_STATUS_LABELS[event.status] ?? event.status,
    state: event.status === 'CANCELLED' ? 'cancelled' : event.status === 'REFUNDED' ? 'refunded' : 'done',
    at: event.at,
    note: event.note ?? (event.status === 'CANCELLED' ? order.cancelReason : null),
  }));
}

/** Customer-facing delivery estimate for the current status (null for terminal states). */
export function deliveryEstimate(order: Pick<Order, 'status' | 'updatedAt' | 'statusHistory'>): string | null {
  switch (order.status) {
    case 'PLACED':
    case 'CONFIRMED':
      return 'Estimated delivery in 5–7 business days';
    case 'PROCESSING':
      return 'Packing now — expected to ship within 1–2 business days';
    case 'SHIPPED':
      return 'Expected in 3–5 business days';
    case 'OUT_FOR_DELIVERY':
      return 'Arriving today';
    case 'DELIVERED': {
      const event = lastEvent(order.statusHistory ?? [], 'DELIVERED');
      return `Delivered ${formatDateTime(event?.at ?? order.updatedAt)}`;
    }
    default:
      return null;
  }
}

const DOT_CLASS: Record<StepState, string> = {
  done: 'border-success bg-success text-white',
  current: 'border-brand bg-white text-brand ring-4 ring-brand/15',
  upcoming: 'border-line-strong bg-white text-transparent',
  cancelled: 'border-brand-dark bg-brand-dark text-white',
  refunded: 'border-ink-3 bg-ink-3 text-white',
};

const LABEL_CLASS: Record<StepState, string> = {
  done: 'font-bold text-success',
  current: 'font-bold text-ink',
  upcoming: 'text-ink-3',
  cancelled: 'font-bold text-brand-dark',
  refunded: 'font-bold text-ink-2',
};

function StepGlyph({ state }: { state: StepState }) {
  if (state === 'current') return <span className="h-2 w-2 rounded-full bg-brand" />;
  if (state === 'cancelled') {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === 'refunded') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OrderTimeline({ order }: { order: Order }) {
  const steps = buildTimeline(order);
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const lineDone = step.state === 'done' && !isLast && steps[index + 1].state !== 'upcoming';
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0" aria-current={step.state === 'current' ? 'step' : undefined}>
            {!isLast && (
              <span aria-hidden="true" className={`absolute left-[9px] top-5 h-[calc(100%-1.25rem)] w-0.5 ${lineDone ? 'bg-success' : 'bg-line'}`} />
            )}
            <span aria-hidden="true" className={`relative z-[1] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${DOT_CLASS[step.state]}`}>
              <StepGlyph state={step.state} />
            </span>
            <div className="min-w-0 flex-1 -mt-0.5">
              <p className={`text-[14px] ${LABEL_CLASS[step.state]}`}>
                {step.label}
                {step.state === 'current' && <span className="sr-only"> (current status)</span>}
                {step.state === 'done' && <span className="sr-only"> (completed)</span>}
              </p>
              {step.at ? (
                <p className="text-[12px] text-ink-3">{formatDateTime(step.at)}</p>
              ) : step.state === 'upcoming' ? (
                <p className="text-[12px] text-ink-4">Pending</p>
              ) : null}
              {step.note && <p className="mt-0.5 text-[12px] text-ink-2">{step.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default OrderTimeline;
