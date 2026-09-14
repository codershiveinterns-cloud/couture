export default function StarRating({
  rating,
  reviewCount,
  size = 'sm',
}: {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
}) {
  const rounded = Math.round(rating * 2) / 2;
  const starSize = size === 'md' ? 'text-base' : 'text-sm';

  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
      <div className={`flex ${starSize} text-amber-400`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= rounded;
          const half = !filled && i + 0.5 === rounded;
          return (
            <span key={i} className="relative inline-block">
              <span className="text-slate-200">★</span>
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden text-amber-400"
                  style={{ width: half ? '50%' : '100%' }}
                >
                  ★
                </span>
              )}
            </span>
          );
        })}
      </div>
      {typeof reviewCount === 'number' && (
        <span className="text-xs text-slate-500">({reviewCount})</span>
      )}
    </div>
  );
}
