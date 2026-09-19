import type { Metadata } from 'next';
import OrdersList from '@/components/account/OrdersList';

export const metadata: Metadata = {
  title: 'Orders',
  description: 'Your Couture order history.',
};

export default function OrdersPage() {
  return <OrdersList />;
}
