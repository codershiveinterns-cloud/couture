import type { Metadata } from 'next';
import { ReviewsView } from '@/components/admin/reviews/ReviewsView';

export const metadata: Metadata = { title: 'Reviews · Couture Admin' };

export default function Page() {
  return <ReviewsView />;
}
