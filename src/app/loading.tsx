export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading page" role="status">
      <span className="sr-only">Loading…</span>
      {/* Breadcrumb / toolbar spacer */}
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="shimmer h-4 w-40 rounded-sm" />
      </div>
      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="shimmer aspect-[16/9] w-full rounded-sm sm:aspect-[3/1]" />
      </div>
      {/* Section title + product grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3">
          <div className="shimmer h-6 w-56 rounded-sm sm:h-7 sm:w-72" />
          <div className="shimmer h-3 w-40 rounded-sm" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-white" aria-hidden="true">
              <div className="shimmer aspect-[3/4] w-full rounded-sm" />
              <div className="flex flex-col gap-2 px-2.5 pb-3 pt-2.5">
                <div className="shimmer h-4 w-1/2 rounded-sm" />
                <div className="shimmer h-3.5 w-5/6 rounded-sm" />
                <div className="shimmer h-3.5 w-2/5 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
