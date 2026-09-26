import type { PillTone } from '@/components/admin/AdminPage';
import type { OrderStatus, PaymentStatus } from '@/lib/services/types';

export const ORDER_STATUS_TONES: Record<OrderStatus, PillTone> = {
  PLACED: 'info',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  SHIPPED: 'warning',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'neutral',
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, PillTone> = {
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  CANCELLED: 'neutral',
  REFUNDED: 'neutral',
};
