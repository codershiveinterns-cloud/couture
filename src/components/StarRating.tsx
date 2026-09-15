function formatCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
  }
  return String(count);
}

/**
 * Myntra-style rating: `4.5 ★ | 298` — numeric rating, green star, and an
 * optional review count separated by a muted pipe.
 */
export default function StarRating({
  rating,
  reviewCount,
  size = 'sm',
}: {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
}) {
  const value = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const display = (Math.round(value * 10) / 10).toFixed(1);
  const md = size === 'md';
  const starSize = md ? 14 : 11;
  const label =
    typeof reviewCount === 'number'
      ? `Rated ${display} out of 5 from ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
      : `Rated ${display} out of 5`;

  return (
    <span
      className={`inline-flex items-center gap-1 leading-none text-ink ${md ? 'text-[14px]' : 'text-[12px]'}`}
      aria-label={label}
      role="img"
    >
      <span className="font-bold">{display}</span>
      <svg
        aria-hidden="true"
        width={starSize}
        height={starSize}
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-rating"
      >
        <path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 6 21l1.3-6.8-5-4.7 6.8-.8L12 2.5z" />
      </svg>
      {typeof reviewCount === 'number' && (
        <>
          <span aria-hidden="true" className="px-0.5 text-ink-4">
            |
          </span>
          <span className="text-ink-2">{formatCount(reviewCount)}</span>
        </>
      )}
    </span>
  );
}
