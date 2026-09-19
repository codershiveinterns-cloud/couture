import type { ReviewSummary as ReviewSummaryData } from '@/lib/services/types';

export interface ReviewSummaryProps {
  summary: ReviewSummaryData;
  className?: string;
}

// Myntra colours its distribution bars by sentiment: green for 3+ stars,
// orange for 2, pink/red for 1.
function barColor(rating: number): string {
  if (rating >= 3) return 'bg-rating';
  if (rating === 2) return 'bg-discount';
  return 'bg-brand';
}

export function ReviewSummary({ summary, className = '' }: ReviewSummaryProps) {
  const { average, totalCount, distribution } = summary;
  const countLabel = `${totalCount} ${totalCount === 1 ? 'Verified Buyer' : 'Verified Buyers'}`;

  return (
    <div className={`rounded-sm border border-line bg-white p-5 ${className}`}>
      <div className="flex items-center gap-5">
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-1 text-[44px] font-bold leading-none tracking-tight text-ink">
            {totalCount > 0 ? average.toFixed(1) : '–'}
            <span className="text-[28px] text-rating" aria-hidden="true">
              ★
            </span>
          </span>
          <span className="mt-1.5 text-[13px] text-ink-3">{totalCount > 0 ? countLabel : 'No ratings yet'}</span>
        </div>

        <ol className="flex flex-1 flex-col gap-1.5 border-l border-line pl-5" aria-label="Rating distribution">
          {distribution.map((bucket) => (
            <li key={bucket.rating} className="flex items-center gap-2 text-[12px]">
              <span className="flex w-6 shrink-0 items-center gap-0.5 font-medium text-ink-2">
                {bucket.rating}
                <span className="text-ink-4" aria-hidden="true">
                  ★
                </span>
              </span>
              <div
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={bucket.percent}
                aria-label={`${bucket.rating}-star reviews: ${bucket.count} (${bucket.percent}%)`}
                className="h-1 flex-1 overflow-hidden rounded-full bg-surface"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ease-out ${barColor(bucket.rating)}`}
                  style={{ width: `${bucket.percent}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-right tabular-nums text-ink-3">{bucket.count}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default ReviewSummary;
