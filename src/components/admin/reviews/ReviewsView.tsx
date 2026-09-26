'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdminCard, AdminPage, StatusPill } from '@/components/admin/AdminPage';
import {
  FilterSelect,
  formatDate,
  LINK_CLASS,
  Pagination,
  SearchBox,
  Stars,
  StatTile,
  TableSkeleton,
} from '@/components/admin/orders/shared';
import { Button, Modal } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useAllReviews } from '@/hooks/useAllReviews';
import { deleteReviewAsAdmin, setReviewStatus } from '@/lib/services/reviews';
import type { AdminReview, ReviewStatus } from '@/lib/services/types';

const PAGE_SIZE = 10;
const EXCERPT_LENGTH = 180;

type StatusFilter = 'all' | ReviewStatus;
type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';
type SourceFilter = 'all' | 'customer' | 'seeded';

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
];
const RATING_OPTIONS: readonly { value: RatingFilter; label: string }[] = [
  { value: 'all', label: 'All ratings' },
  ...(['5', '4', '3', '2', '1'] as const).map((value) => ({ value, label: `${value} star${value === '1' ? '' : 's'}` })),
];
const SOURCE_OPTIONS: readonly { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'customer', label: 'Customer reviews' },
  { value: 'seeded', label: 'Seeded (demo)' },
];

function ReviewRow({
  review,
  expanded,
  onToggleExpand,
  onDelete,
}: {
  review: AdminReview;
  expanded: boolean;
  onToggleExpand(): void;
  onDelete(): void;
}) {
  const hidden = review.status === 'hidden';
  const long = review.body.length > EXCERPT_LENGTH;
  const body = long && !expanded ? `${review.body.slice(0, EXCERPT_LENGTH).trimEnd()}…` : review.body;

  const toggleStatus = () => {
    const result = setReviewStatus(review.id, hidden ? 'published' : 'hidden');
    if (!result.ok) toast.error(result.error);
    else toast.success(hidden ? 'Review published' : 'Review hidden from the storefront');
  };

  return (
    <li className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-5 sm:px-5 ${hidden ? 'bg-surface/60' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Stars rating={review.rating} />
          <StatusPill tone={hidden ? 'neutral' : 'success'}>{hidden ? 'Hidden' : 'Published'}</StatusPill>
          <StatusPill tone={review.isSeeded ? 'neutral' : 'info'}>{review.isSeeded ? 'Seeded' : 'Customer'}</StatusPill>
          {review.verifiedPurchase && <span className="text-[12px] font-bold text-success">Verified purchase</span>}
        </div>
        <p className="mt-2 text-[13px] text-ink-3">
          on{' '}
          {review.productSlug ? (
            <Link href={`/products/${review.productSlug}`} className={LINK_CLASS} target="_blank" rel="noopener noreferrer">
              {review.productName}
            </Link>
          ) : (
            <span className="font-bold text-ink">{review.productName}</span>
          )}
        </p>
        {review.title && <h3 className="mt-2 text-[14px] font-bold text-ink">{review.title}</h3>}
        <p className="mt-1 whitespace-pre-line break-words text-[14px] leading-relaxed text-ink-2">{body}</p>
        {long && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            className="mt-1 rounded-sm text-[12px] font-bold uppercase tracking-wide text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
        <p className="mt-2 text-[12px] text-ink-3">
          <span className="font-bold text-ink-2">{review.authorName}</span> · {formatDate(review.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
        <Button variant="secondary" size="sm" onClick={toggleStatus} aria-label={`${hidden ? 'Publish' : 'Hide'} review by ${review.authorName}`}>
          {hidden ? 'Publish' : 'Hide'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Delete review by ${review.authorName}`}>
          Delete
        </Button>
      </div>
    </li>
  );
}

export function ReviewsView() {
  const { reviews, isHydrated } = useAllReviews();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [rating, setRating] = useState<RatingFilter>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [deleting, setDeleting] = useState<AdminReview | null>(null);

  const summary = useMemo(() => {
    const published = reviews.filter((review) => review.status === 'published');
    const average = published.length > 0 ? published.reduce((sum, review) => sum + review.rating, 0) / published.length : 0;
    return {
      total: reviews.length,
      hidden: reviews.length - published.length,
      customer: reviews.filter((review) => !review.isSeeded).length,
      average,
    };
  }, [reviews]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reviews.filter((review) => {
      if (status !== 'all' && review.status !== status) return false;
      if (rating !== 'all' && Math.round(review.rating) !== Number(rating)) return false;
      if (source !== 'all' && review.isSeeded !== (source === 'seeded')) return false;
      return !needle || review.productName.toLowerCase().includes(needle);
    });
  }, [reviews, search, status, rating, source]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };
  const hasFilters = search.trim() !== '' || status !== 'all' || rating !== 'all' || source !== 'all';

  const toggleExpanded = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const confirmDelete = () => {
    if (!deleting) return;
    const result = deleteReviewAsAdmin(deleting.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Review deleted');
    setDeleting(null);
  };

  return (
    <AdminPage title="Reviews" description="Moderate what shoppers see on product pages: hide, publish or delete reviews.">
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="All reviews" value={isHydrated ? summary.total : '—'} />
        <StatTile label="From customers" value={isHydrated ? summary.customer : '—'} hint="Excludes seeded demo reviews" />
        <StatTile label="Hidden" value={isHydrated ? summary.hidden : '—'} />
        <StatTile label="Avg. rating" value={isHydrated && summary.average > 0 ? summary.average.toFixed(1) : '—'} hint="Published reviews" />
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3">
          <SearchBox
            id="reviews-search"
            label="Search by product"
            placeholder="Search by product name"
            value={search}
            onChange={withReset(setSearch)}
            className="w-full sm:w-auto sm:flex-1 sm:basis-64"
          />
          <FilterSelect id="reviews-status" label="Status" value={status} onChange={withReset(setStatus)} options={STATUS_OPTIONS} />
          <FilterSelect id="reviews-rating" label="Rating" value={rating} onChange={withReset(setRating)} options={RATING_OPTIONS} />
          <FilterSelect id="reviews-source" label="Source" value={source} onChange={withReset(setSource)} options={SOURCE_OPTIONS} />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('all');
                setRating('all');
                setSource('all');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {!isHydrated ? (
          <TableSkeleton rows={6} />
        ) : visible.length === 0 ? (
          <p className="px-4 py-12 text-center text-[14px] text-ink-3">
            {reviews.length === 0 ? 'There are no reviews yet.' : 'No reviews match these filters.'}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {visible.map((review) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  expanded={expanded.has(review.id)}
                  onToggleExpand={() => toggleExpanded(review.id)}
                  onDelete={() => setDeleting(review)}
                />
              ))}
            </ul>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPage={setPage}
              noun="reviews"
            />
          </>
        )}
      </AdminCard>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        size="sm"
        title="Delete this review?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep review
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        {deleting && (
          <p className="text-[14px] leading-relaxed text-ink-2">
            The {deleting.rating}-star review by <span className="font-bold text-ink">{deleting.authorName}</span> on{' '}
            <span className="font-bold text-ink">{deleting.productName}</span> will be permanently removed and no longer count towards
            the product rating. To take it down temporarily, hide it instead.
          </p>
        )}
      </Modal>
    </AdminPage>
  );
}

export default ReviewsView;
