import { useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  buildReviewList,
  computeReviewSummary,
  deleteReview,
  getSeededReviews,
  getUserReviewsForProduct,
  isReviewPublished,
  moderatedSeededCount,
  reviewModerationStore,
  reviewsStore,
  submitReview,
  visibleSeededReviews,
} from '@/lib/services/reviews';
import type { Review, ReviewSummary, ReviewView, ServiceResult } from '@/lib/services/types';
import type { ReviewInput } from '@/lib/validation';

export interface UseReviewsParams {
  productId: string;
  avgRating: number;
  reviewCount: number;
}

export interface UseReviewsResult {
  /** Your review first ("isOwn"), then other shoppers' reviews newest first, then seeded demo reviews. */
  reviews: ReviewView[];
  summary: ReviewSummary;
  userReview: Review | null;
  /** Signed in and has not reviewed this product yet. */
  canReview: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  submitReview(input: ReviewInput): Promise<ServiceResult<Review>>;
  deleteReview(reviewId: string): Promise<ServiceResult>;
}

const SIGNED_OUT = { ok: false as const, error: 'Please sign in to write a review' };

export function useReviews({ productId, avgRating, reviewCount }: UseReviewsParams): UseReviewsResult {
  const { user, isHydrated } = useAuth();
  const store = reviewsStore();
  const allUserReviews = useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
  const moderationStore = reviewModerationStore();
  const moderation = useSyncExternalStore(
    moderationStore.subscribe,
    moderationStore.get,
    moderationStore.getServerSnapshot,
  );
  const userId = user?.id ?? null;

  const allSeeded = useMemo(() => getSeededReviews(productId, avgRating, reviewCount), [productId, avgRating, reviewCount]);
  const seeded = useMemo(() => visibleSeededReviews(allSeeded, moderation), [allSeeded, moderation]);
  const baseCount = Math.max(0, reviewCount - moderatedSeededCount(allSeeded, moderation));
  // Includes the shopper's own hidden review (so they cannot post twice); lists and summary use published only.
  const productUserReviews = useMemo(
    () => getUserReviewsForProduct(productId, allUserReviews),
    [productId, allUserReviews],
  );
  const publishedUserReviews = useMemo(() => productUserReviews.filter(isReviewPublished), [productUserReviews]);
  const reviews = useMemo(
    () => buildReviewList(seeded, publishedUserReviews, userId),
    [seeded, publishedUserReviews, userId],
  );
  const summary = useMemo(
    () =>
      computeReviewSummary({ avgRating, reviewCount: baseCount, userReviews: publishedUserReviews, visibleReviews: reviews }),
    [avgRating, baseCount, publishedUserReviews, reviews],
  );

  return useMemo<UseReviewsResult>(() => {
    const userReview = userId ? (productUserReviews.find((r) => r.userId === userId) ?? null) : null;
    return {
      reviews,
      summary,
      userReview,
      canReview: !!user && !userReview,
      isAuthenticated: !!user,
      isHydrated,
      submitReview: (input) => (user ? submitReview(user, productId, input) : Promise.resolve(SIGNED_OUT)),
      deleteReview: (reviewId) => (userId ? deleteReview(userId, reviewId) : Promise.resolve(SIGNED_OUT)),
    };
  }, [reviews, summary, productUserReviews, user, userId, isHydrated, productId]);
}
