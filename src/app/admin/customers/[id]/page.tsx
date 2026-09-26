import type { Metadata } from 'next';
import { CustomerDetailView } from '@/components/admin/customers/CustomerDetailView';

export const metadata: Metadata = { title: 'Customer · Couture Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDetailView id={decodeURIComponent(id)} />;
}
