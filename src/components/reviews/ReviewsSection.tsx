'use client';

import type { ReactNode } from 'react';
import StarRating from '@/components/StarRating';
import { Button } from '@/components/ui/Button';
import { useReviews } from '@/hooks/useReviews';
import { buildLoginHref, buildRegisterHref } from '@/lib/safeRedirect';
import { ReviewForm } from './ReviewForm';
import { ReviewList, formatReviewDate } from './ReviewList';
import { ReviewSummary } from './ReviewSummary';

export interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
  avgRating: number;
  reviewCount: number;
}

function WriteReviewPlaceholder() {
  return (
    <div aria-hidden="true" className="animate-pulse rounded-sm border border-line bg-white p-5">
      <div className="h-4 w-1/3 rounded-sm bg-surface" />
      <div className="mt-4 h-3 w-2/3 rounded-sm bg-surface" />
      <div className="mt-6 h-11 w-36 rounded-sm bg-surface" />
    </div>
  );
}

export function ReviewsSection({ productId, productSlug, avgRating, reviewCount }: ReviewsSectionProps) {
  const { reviews, summary, userReview, canReview, isAuthenticated, isHydrated, submitReview, deleteReview } =
    useReviews({ productId, avgRating, reviewCount });
  const productHref = `/products/${productSlug}`;

  let writePanel: ReactNode;
  if (!isHydrated) {
    writePanel = <WriteReviewPlaceholder />;
  } else if (!isAuthenticated) {
    writePanel = (
      <div className="rounded-sm border border-line bg-white p-5">
        <h3 className="text-[16px] font-bold text-ink">Share your experience</h3>
        <p className="mt-1 text-[14px] text-ink-3">Sign in to rate this product and write a review.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href={buildLoginHref(productHref)}>Login to review</Button>
          <Button href={buildRegisterHref(productHref)} variant="secondary">
            Signup
          </Button>
        </div>
      </div>
    );
  } else if (userReview) {
    writePanel = (
      <div className="rounded-sm border border-line bg-white p-5">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
              <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h3 className="text-[16px] font-bold text-ink">You reviewed this product</h3>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
          <StarRating rating={userReview.rating} />
          <span>Posted {formatReviewDate(userReview.createdAt)}</span>
        </div>
        <p className="mt-3 text-[14px] text-ink-2">
          Thanks for sharing. Your review is marked in the list, where you can delete it if you change your mind.
        </p>
      </div>
    );
  } else if (canReview) {
    writePanel = (
      <div className="rounded-sm border border-line bg-white p-5">
        <h3 className="text-[16px] font-bold text-ink">Write a review</h3>
        <p className="mt-1 text-[14px] text-ink-3">Help other shoppers by rating this product.</p>
        <ReviewForm onSubmit={submitReview} className="mt-4" />
      </div>
    );
  }

  return (
    <section aria-labelledby="reviews-heading" className="mt-12 scroll-mt-24 border-t border-line pt-8">
      <h2 id="reviews-heading" className="mb-6 text-[16px] font-bold uppercase tracking-wide text-ink sm:text-[18px]">
        Ratings &amp; reviews
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <ReviewSummary summary={summary} />
          {writePanel}
        </div>
        <ReviewList reviews={reviews} onDelete={deleteReview} />
      </div>
    </section>
  );
}

export default ReviewsSection;
