import type { Metadata } from 'next';
import CartView from '@/components/cart/CartView';

export const metadata: Metadata = {
  title: 'My Bag',
  description: 'Review the items in your Couture bag, apply a coupon, and proceed to checkout.',
};

export default function CartPage() {
  return <CartView />;
}
