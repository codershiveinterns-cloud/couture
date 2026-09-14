export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-4 w-56 animate-pulse rounded bg-stone-100" />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <div className="aspect-square w-full animate-pulse rounded-xl bg-stone-100 sm:flex-1" />
          <div className="flex gap-2 sm:w-20 sm:flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-square w-16 shrink-0 animate-pulse rounded-lg bg-stone-100 sm:w-full" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-3 w-20 animate-pulse rounded bg-stone-100" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-40 animate-pulse rounded bg-stone-100" />
          <div className="mt-4 h-7 w-24 animate-pulse rounded bg-stone-100" />
          <div className="h-10 w-full animate-pulse rounded bg-stone-100" />
          <div className="h-12 w-full animate-pulse rounded-full bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
