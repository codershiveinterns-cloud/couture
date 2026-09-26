import type { Metadata } from 'next';
import { CouponsView } from '@/components/admin/coupons/CouponsView';

export const metadata: Metadata = { title: 'Coupons · Couture Admin' };

export default function Page() {
  return <CouponsView />;
}
