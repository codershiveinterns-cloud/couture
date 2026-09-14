'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink/50">
        We couldn&rsquo;t load this page. Make sure the API server is running, then try again.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-dark active:scale-95"
      >
        Try Again
      </button>
    </div>
  );
}
