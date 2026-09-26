import type { Metadata } from 'next';
import { CustomersView } from '@/components/admin/customers/CustomersView';

export const metadata: Metadata = { title: 'Customers · Couture Admin' };

export default function Page() {
  return <CustomersView />;
}
