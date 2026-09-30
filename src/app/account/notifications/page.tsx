import type { Metadata } from 'next';
import NotificationsList from '@/components/notifications/NotificationsList';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Order and account updates from Couture.',
};

export default function NotificationsPage() {
  return <NotificationsList />;
}
