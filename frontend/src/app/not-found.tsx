import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="text-6xl font-bold text-slate-200">404</span>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-dark active:scale-95"
      >
        Back to Home
      </Link>
    </div>
  );
}
