import type { Metadata } from 'next';
import OrderDetail from '@/components/account/OrderDetail';

export async function generateMetadata({ params }: PageProps<'/account/orders/[orderNumber]'>): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${decodeURIComponent(orderNumber).toUpperCase()}` };
}

export default async function OrderDetailPage({ params }: PageProps<'/account/orders/[orderNumber]'>) {
  const { orderNumber } = await params;
  return <OrderDetail orderNumber={decodeURIComponent(orderNumber)} />;
}
