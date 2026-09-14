import ProductCardSkeleton from '@/components/ProductCardSkeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-8 w-56 animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-4 w-24 animate-pulse rounded bg-slate-100" />

      <div className="mt-5 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
        ))}
      </div>

      <div className="mt-6 border-b border-slate-200 pb-4">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
