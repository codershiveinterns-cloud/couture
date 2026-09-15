import ProductCardSkeleton from '@/components/ProductCardSkeleton';

const BLOCK = 'animate-pulse rounded-sm bg-surface';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading products">
      {/* Breadcrumb */}
      <div className={`h-4 w-28 ${BLOCK}`} />
      {/* Title + count */}
      <div className="mt-3 flex items-baseline gap-2">
        <div className={`h-5 w-36 ${BLOCK}`} />
        <div className={`h-4 w-16 ${BLOCK}`} />
      </div>

      {/* Scope pills + sort */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-surface" />
          ))}
        </div>
        <div className={`h-10 w-52 ${BLOCK}`} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
