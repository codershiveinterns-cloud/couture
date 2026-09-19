import type { Metadata } from 'next';
import { Suspense } from 'react';
import CheckoutSuccess from '@/components/checkout/CheckoutSuccess';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  description: 'Your Couture order has been placed.',
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-ink-4">
          <Spinner size="lg" label="Loading your order" />
        </div>
      }
    >
      <CheckoutSuccess />
    </Suspense>
  );
}
