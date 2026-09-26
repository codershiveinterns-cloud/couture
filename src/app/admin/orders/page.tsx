import type { Metadata } from 'next';
import { OrdersView } from '@/components/admin/orders/OrdersView';

export const metadata: Metadata = { title: 'Orders · Couture Admin' };

export default function Page() {
  return <OrdersView />;
}
