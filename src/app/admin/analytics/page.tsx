import type { Metadata } from 'next';
import { AnalyticsView } from './AnalyticsView';

export const metadata: Metadata = { title: 'Sales analytics', robots: { index: false, follow: false } };

export default function AdminAnalyticsPage() {
  return <AnalyticsView />;
}
