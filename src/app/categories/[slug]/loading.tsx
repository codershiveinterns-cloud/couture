import ProductCardSkeleton from '@/components/ProductCardSkeleton';

export default function Loading() {
  return (
    <div>
      <div className="h-48 w-full animate-pulse bg-stone-100 sm:h-64" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-4 w-40 animate-pulse rounded bg-stone-100" />
        <div className="mt-4 border-b border-ink/10 pb-4">
          <div className="h-4 w-24 animate-pulse rounded bg-stone-100" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
