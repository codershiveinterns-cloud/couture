export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="aspect-square w-full animate-pulse bg-slate-100" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
        <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
        <div className="mt-1 h-4 w-14 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
