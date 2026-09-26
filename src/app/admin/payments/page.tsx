import type { Metadata } from 'next';
import { PaymentsView } from '@/components/admin/payments/PaymentsView';

export const metadata: Metadata = { title: 'Payments · Couture Admin' };

export default function Page() {
  return <PaymentsView />;
}
