import type { Metadata } from 'next';
import { OrderDetailView } from '@/components/admin/orders/OrderDetailView';

export const metadata: Metadata = { title: 'Order · Couture Admin' };

export default async function Page({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderDetailView orderNumber={decodeURIComponent(orderNumber)} />;
}
