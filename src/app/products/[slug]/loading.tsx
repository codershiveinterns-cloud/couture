import ProductCardSkeleton from '@/components/ProductCardSkeleton';

const BLOCK = 'animate-pulse rounded-sm bg-surface';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading product">
      {/* Breadcrumb */}
      <div className={`mb-5 h-4 w-64 ${BLOCK}`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
        {/* Gallery: single slide on mobile, 2×2 grid on tablet/desktop */}
        <div>
          <div className={`aspect-[3/4] w-full sm:hidden ${BLOCK}`} />
          <div className="hidden grid-cols-2 gap-1.5 sm:grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`aspect-[3/4] ${BLOCK}`} />
            ))}
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col">
          <div className={`h-6 w-40 ${BLOCK}`} />
          <div className={`mt-2 h-5 w-3/4 ${BLOCK}`} />
          <div className={`mt-4 h-8 w-32 ${BLOCK}`} />

          <div className="mt-5 flex flex-col gap-6 border-t border-line pt-5">
            <div>
              <div className={`h-7 w-48 ${BLOCK}`} />
              <div className={`mt-2 h-4 w-32 ${BLOCK}`} />
            </div>
            <div>
              <div className={`h-4 w-28 ${BLOCK}`} />
              <div className="mt-3 flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[50px] w-[50px] animate-pulse rounded-full bg-surface" />
                ))}
              </div>
            </div>
            <div>
              <div className={`h-4 w-20 ${BLOCK}`} />
              <div className={`mt-3 h-11 w-[132px] ${BLOCK}`} />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className={`h-[54px] flex-1 ${BLOCK}`} />
                <div className={`h-[54px] flex-1 ${BLOCK}`} />
              </div>
              <div className={`h-12 w-full ${BLOCK}`} />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-line pt-6">
            <div className={`h-4 w-36 ${BLOCK}`} />
            <div className={`h-3.5 w-full ${BLOCK}`} />
            <div className={`h-3.5 w-11/12 ${BLOCK}`} />
            <div className={`h-3.5 w-2/3 ${BLOCK}`} />
          </div>
        </div>
      </div>

      {/* Similar products rail */}
      <div className="mt-12 border-t border-line pt-8">
        <div className={`h-5 w-44 ${BLOCK}`} />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={i >= 3 ? 'hidden lg:block' : i >= 2 ? 'hidden sm:block' : ''}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
