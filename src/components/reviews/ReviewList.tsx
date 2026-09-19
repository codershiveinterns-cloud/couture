'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/context/ToastContext';
import type { ReviewView, ServiceResult } from '@/lib/services/types';

export const INITIAL_VISIBLE_REVIEWS = 3;

// Fixed time zone so server and client render the same date string.
const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : DATE_FORMAT.format(date);
}

export interface ReviewListProps {
  reviews: ReviewView[];
  onDelete(reviewId: string): Promise<ServiceResult>;
  className?: string;
}

/** Myntra-style compact rating pill: green for 3+, orange for 2, pink for 1. */
function RatingPill({ rating }: { rating: number }) {
  const tone = rating >= 3 ? 'bg-rating' : rating === 2 ? 'bg-discount' : 'bg-brand';
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center gap-0.5 rounded-sm px-1.5 text-[12px] font-bold text-white ${tone}`}
      aria-label={`Rated ${rating} out of 5`}
    >
      {rating}
      <span aria-hidden="true">★</span>
    </span>
  );
}

function ReviewCard({ review, onRequestDelete }: { review: ReviewView; onRequestDelete(): void }) {
  return (
    <li className="animate-fade-in border-b border-line py-5 first:pt-0">
      <div className="flex items-start gap-3">
        <RatingPill rating={review.rating} />
        <div className="min-w-0 flex-1">
          {review.title && <h3 className="text-[14px] font-bold text-ink">{review.title}</h3>}
          <p className={`whitespace-pre-line text-[14px] leading-relaxed text-ink-2 ${review.title ? 'mt-1' : ''}`}>
            {review.body}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-3">
            <span className="font-medium text-ink-2">{review.authorName}</span>
            <span aria-hidden="true">|</span>
            <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
            {review.verifiedPurchase && (
              <Badge variant="success" size="sm" dot>
                Verified buyer
              </Badge>
            )}
            {review.isOwn && (
              <Badge variant="brand" size="sm">
                Your review
              </Badge>
            )}
          </div>
        </div>
        {review.isOwn && (
          <Button variant="ghost" size="sm" onClick={onRequestDelete} className="-mr-2 shrink-0 text-brand">
            Delete
          </Button>
        )}
      </div>
    </li>
  );
}

export function ReviewList({ reviews, onDelete, className = '' }: ReviewListProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const visible = expanded ? reviews : reviews.slice(0, INITIAL_VISIBLE_REVIEWS);
  const hiddenCount = reviews.length - visible.length;

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    const result = await onDelete(pendingDeleteId);
    setDeleting(false);
    if (result.ok) {
      toast.success('Your review was deleted');
      setPendingDeleteId(null);
    } else {
      toast.error(result.error);
    }
  };

  if (reviews.length === 0) {
    return (
      <EmptyState
        size="compact"
        icon="✍️"
        title="No reviews yet"
        description="Be the first to share what you think about this product."
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <h3 className="mb-2 text-[14px] font-bold uppercase tracking-wide text-ink">
        Customer reviews <span className="font-normal text-ink-3">({reviews.length})</span>
      </h3>
      <ul className="flex flex-col">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} onRequestDelete={() => setPendingDeleteId(review.id)} />
        ))}
      </ul>

      {hiddenCount > 0 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[14px] font-bold uppercase text-brand hover:underline"
          >
            View {hiddenCount} more {hiddenCount === 1 ? 'review' : 'reviews'}
          </button>
        </div>
      )}

      <Modal
        open={pendingDeleteId !== null}
        onClose={() => {
          if (!deleting) setPendingDeleteId(null);
        }}
        size="sm"
        title="Delete your review?"
        description="This removes your review and rating from this product. You can write a new one afterwards."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting} loadingText="Deleting…">
              Delete review
            </Button>
          </>
        }
      >
        <span className="sr-only">Confirm deletion</span>
      </Modal>
    </div>
  );
}

export default ReviewList;
