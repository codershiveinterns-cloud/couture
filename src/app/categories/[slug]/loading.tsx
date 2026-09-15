import ProductCardSkeleton from '@/components/ProductCardSkeleton';

const BLOCK = 'animate-pulse rounded-sm bg-surface';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading category">
      {/* Hero banner */}
      <div className="relative mb-6 aspect-[16/7] w-full animate-pulse overflow-hidden rounded-sm bg-surface sm:aspect-[21/6]">
        <div className="absolute inset-0 flex flex-col justify-center gap-3 px-5 sm:px-10">
          <div className="h-5 w-16 rounded-full bg-line" />
          <div className="h-8 w-48 rounded-sm bg-line sm:h-11 sm:w-72" />
          <div className="h-3.5 w-64 rounded-sm bg-line" />
        </div>
      </div>

      {/* Breadcrumb */}
      <div className={`h-4 w-40 ${BLOCK}`} />
      <div className="mt-3 flex items-baseline gap-2">
        <div className={`h-5 w-36 ${BLOCK}`} />
        <div className={`h-4 w-16 ${BLOCK}`} />
      </div>

      {/* Page label + sort */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-5">
        <div className={`h-4 w-24 ${BLOCK}`} />
        <div className={`h-10 w-52 ${BLOCK}`} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
