import type { Metadata } from 'next';
import { OutboxView } from '@/components/admin/notifications/OutboxView';

export const metadata: Metadata = { title: 'Notifications · Couture Admin' };

export default function Page() {
  return <OutboxView />;
}
