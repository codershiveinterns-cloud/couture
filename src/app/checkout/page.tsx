import type { Metadata } from 'next';
import CheckoutView from '@/components/checkout/CheckoutView';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Choose a shipping address and payment method, review your order, and place it.',
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
