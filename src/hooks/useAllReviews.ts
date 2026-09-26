import { useMemo } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { useHydrated } from '@/hooks/useHydrated';
import { listAllReviews, reviewModerationStore, reviewsStore } from '@/lib/services/reviews';
import type { AdminReview } from '@/lib/services/types';
import { useJsonStore } from './useJsonStore';

export interface UseAllReviewsOptions {
  /** Include generated demo reviews (default true). */
  includeSeeded?: boolean;
}

/** Admin moderation list, newest first. Mutations: setReviewStatus / deleteReviewAsAdmin (services/reviews). */
export function useAllReviews({ includeSeeded = true }: UseAllReviewsOptions = {}): {
  reviews: AdminReview[];
  isHydrated: boolean;
} {
  const userReviews = useJsonStore(reviewsStore());
  const moderation = useJsonStore(reviewModerationStore());
  const { products } = useCatalog();
  const isHydrated = useHydrated();
  const reviews = useMemo(
    () => (isHydrated && userReviews && moderation && products ? listAllReviews({ includeSeeded }) : []),
    [isHydrated, userReviews, moderation, products, includeSeeded],
  );
  return useMemo(() => ({ reviews, isHydrated }), [reviews, isHydrated]);
}
