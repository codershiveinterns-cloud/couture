import type { Metadata } from 'next';
import TrackOrderView from '@/components/storefront/track/TrackOrderView';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Enter your order number and email to follow your Couture order from placement to delivery.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';

export default async function TrackPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return <TrackOrderView initialOrderNumber={first(sp.order).slice(0, 40)} initialEmail={first(sp.email).slice(0, 120)} />;
}
